const ccoDungeonEditor = (() => {

    function createModel(size) {

        const _listeners = [];
        let _layout = createTemplate(size);
        let _hasAllPath = false;
        updateHasAllPaths();
    
        function isDoor(x, y) {
            const middle = Math.floor(size / 2);
            return (x == 0 && y == middle) || (x == size - 1 && y == middle) || (y == 0 && x == middle) || (y == size - 1 && x == middle);
        }
    
        function isInFrontOfDoor(x, y) {
            const middle = Math.floor(size / 2);
            return (x == 1 && y == middle) || (x == size - 2 && y == middle) || (y == 1 && x == middle) || (y == size - 2 && x == middle);
        }
    
        function isBorder(x, y) {
            return (x == 0 || y == 0 || x == size - 1 || y == size - 1) && !isDoor(x, y);
        }
    
        function isEditable(x, y) {
            return !isDoor(x, y) && !isBorder(x, y) && !isInFrontOfDoor(x, y);
        }
    
        function createTemplate(size) {
            const layout = [];
            for (let x = 0; x < size; ++x) {
                const column = [];
                for (let y = 0; y < size; ++y) {
                    const val = isBorder(x, y);
                    column.push(val);
                }
                layout.push(column);
            }
            return layout;
        }
    
        function copy(layout) {
            const newLayout = [];
            for (let x = 0; x < size; ++x) {
                newLayout.push([...layout[x]]);
            }
            return newLayout;
        }

        function hasPathForTargets(start, targets) {

            const matrix = [];
            for (let y = 0; y < size; ++y) {
                const row = [];
                for (let x = 0; x < size; ++x) {
                    row.push((_layout[x][y]) ? 1 : 0);
                }
                matrix.push(row);
            }
            
            const finder = new PF.BestFirstFinder();
            const grid = new PF.Grid(matrix);

            for (const target of targets) {
                if (start[0] == target[0] && start[1] == target[1]) {
                    continue;
                }
                const hasPath = finder.findPath(start[0], start[1], target[0], target[1], grid.clone());
                if (hasPath.length == 0) {
                    return false;
                }
            }

            return true;
        }
    
        function checkAllPaths() {
    
            const middle = Math.floor(size / 2);
            const doors = [[0, middle], [size - 1, middle], [middle, 0], [middle, size - 1]];

            const validationField = doors[0];

            if (!hasPathForTargets(validationField, doors.slice(1))) {
                return false;
            }

            const fields = [];
    
            for (let x = 0; x < size; ++x) {
                for (let y = 0; y < size; ++y) {
                    if (!_layout[x][y] && !isDoor(x, y)) {
                        fields.push([x, y]);
                    }
                }
            }
    
            return hasPathForTargets(validationField, fields);
        }
    
        function updateHasAllPaths() {
    
            if (checkAllPaths()) {
                _hasAllPath = true;
            }
            else {
                _hasAllPath = false;
            }
        }
    
        function hasAllPaths() {
            return _hasAllPath;
        }
    
        function isValid(layout) {
            const emptyLayout = createTemplate(size);
            if (layout.length != size) {
                return false;
            }
            for (let x = 0; x < size; ++x) {
                if (layout[x].length != size) {
                    return false;
                }
                for (let y = 0; y < size; ++y) {
                    if (typeof layout[x][y] !== 'boolean') {
                        return false;
                    }
                    if (emptyLayout[x][y] && !layout[x][y]) {
                        return false;
                    }
                }
            }
            return true;
        }
    
        function isEqual(layout) {
            if (layout.length != _layout.length) {
                return false;
            }
            for (let x = 0; x < layout.length; ++x) {
                if (layout[x].length != _layout[x].length) {
                    return false;
                }
                for (let y = 0; y < layout.length; ++y) {
                    if (layout[x][y] != _layout[x][y]) {
                        return false;
                    }
                }
            }
            return true;
        }
    
        function fireUpdate() {
            _listeners.forEach((l) => {
                l(getLayout());
            });
        }
    
        function getLayout() {
            return copy(_layout);
        }
    
        function setLayout(layout) {
            if (!isValid(layout)) {
                throw new Error('Layout is not valid!');
            }
            if (!isEqual(layout)) {
                _layout = copy(layout);
                updateHasAllPaths();
                fireUpdate();
            }
        }
    
        function swapPos(x, y) {
            if (!isEditable(x, y)) {
                throw new Error('Position is not editable!');
            }
            _layout[x][y] = !_layout[x][y];
            updateHasAllPaths();
            fireUpdate();
        }
    
        function getSize() {
            return size;
        }
    
        function reset() {
            if (!isEqual(createTemplate(size))) {
                _layout = createTemplate(size);
                updateHasAllPaths();
                fireUpdate();
            }
        }
    
        function addListener(listener) {
            _listeners.push(listener);
        }
    
        return {
            isEditable: isEditable,
            isValid: isValid,
            getLayout: getLayout,
            setLayout: setLayout,
            swapPos: swapPos,
            addListener: addListener,
            getSize: getSize,
            isEqual: isEqual,
            reset: reset,
            hasAllPaths: hasAllPaths
        };
    }
    
    function initUI(model, uiElements) {

        const _editorUI = doWith(uiElements.editor, (editor) => {

            const size = model.getSize();
            
            const cells = [];
            const fieldSizeInPercent = 100 / size;

            for (let x = 0; x < size; ++x) {
                const list = [];
                for (let y = 0; y < size; ++y) {
                    const cell = document.createElement('div');
                    cell.style.width = `${fieldSizeInPercent}%`;
                    cell.style.height = '100%';
                    cell.style.display = 'inline-block';
                    cell.classList.add('cell');
                    list.push(cell);
                }
                cells.push(list);
            }

            for (let y = 0; y < size; ++y) {

                const yDiv = document.createElement('div');
                yDiv.style.width = '100%';
                yDiv.style.height = `${fieldSizeInPercent}%`;

                for (let x = 0; x < size; ++x) {
                
                    const cell = cells[x][y];

                    if (model.isEditable(x, y)) {
                        cell.classList.add('editable');
                        cell.addEventListener('click', () => {
                            model.swapPos(x, y);
                        });
                    }

                    yDiv.appendChild(cell);
                }

                editor.appendChild(yDiv);
            }

            function update(layout) {

                if (!model.hasAllPaths()) {
                    editor.classList.add('invalid');
                }
                else {
                    editor.classList.remove('invalid');
                }

                for (let x = 0; x < size; ++x) {
                    for (let y = 0; y < size; ++y) {
                        if (layout[x][y]) {
                            cells[x][y].classList.add('active');
                        }
                        else {
                            cells[x][y].classList.remove('active');
                        }
                    }
                }
            }

            function showTiles(b) {

                if (b) {
                    editor.classList.add('tiles');
                    editor.classList.remove('blocks');
                }
                else {
                    editor.classList.remove('tiles');
                    editor.classList.add('blocks');
                }
            }

            function showLines(b) {

                if (b) {
                    editor.classList.add('lines');
                }
                else {
                    editor.classList.remove('lines');
                }
            }

            showTiles(true);
            showLines(false);
            update(model.getLayout());

            return {
                update: update,
                showTiles: showTiles,
                showLines: showLines
            };
        });

        doWith(uiElements.resetButton, (resetButton) => {
            resetButton.addEventListener('click', () => {
                model.reset();
            });
        });
        
        doWith(uiElements.tilesCheckbox, (tilesCheckbox) => {
            const updateShowTiles = () => {
                doWith(_editorUI, (editorUI) => {
                    editorUI.showTiles(tilesCheckbox.checked);
                });
            };
            updateShowTiles();
            tilesCheckbox.addEventListener('change', () => {
                updateShowTiles();
            });
        });
        
        doWith(uiElements.linesCheckbox, (linesCheckbox) => {
            const updateShowLines = () => {
                doWith(_editorUI, (editorUI) => {
                    editorUI.showLines(linesCheckbox.checked);
                });
            };
            updateShowLines();
            linesCheckbox.addEventListener('change', () => {
                updateShowLines();
            });
        });
        
        doWith(uiElements.copyToClipboard, (copyToClipboard) => {
            copyToClipboard.addEventListener('click', () => {
                doWith(uiElements.outputText, (outputText) => {
                    if (model.hasAllPaths()) {
                        outputText.select();
                        document.execCommand('copy');
                        alert('Dungeon is copied to your clipboard!');
                    }
                });
            });
        });

        doWith(uiElements.parseInputButton, (parseInputButton) => {
            parseInputButton.addEventListener('click', () => {
                doWith(uiElements.inputText, (inputText) => {
                    const str = inputText.value;
                    setStringLayoutToModel(str);
                });
            });
        });
    
        function update(layout) {

            doWith(uiElements.copyToClipboard, (copyToClipboard) => {
                if (model.hasAllPaths()) {
                    copyToClipboard.disabled = false;
                }
                else {
                    copyToClipboard.disabled = true;
                }
            });

            doWith(_editorUI, (editorUI) => {
                editorUI.update(layout);
            });

            doWith(uiElements.outputText, (outputText) => {

                if (!model.hasAllPaths()) {
                    outputText.value = 'Dungeon is not valid!';
                }
                else {
                    outputText.value = `${createURLWithLayout()}\n\`\`\`\n${toFormatedDungeonJsonString(layout)}\n\`\`\``;
                }
            });

            updateQueryStringParam('parse', createLayoutForURL());
        }

        try {
            const layoutFromURL = parseLayoutFromURL();
            if (!isUndefined(layoutFromURL)) {
                if (model.isValid(layoutFromURL)) {
                    model.setLayout(layoutFromURL);
                }
                else {
                    console.log('Layout is not valid!');
                }
            }
        }
        catch (e) {
            console.log(e.message);
        }

        model.addListener(update);
        update(model.getLayout());

        function setStringLayoutToModel(str) {

            const newLayout = stringToLayout(str);

            if (newLayout.error) {
                alert(newLayout.msg);
            }
            else if (!model.isValid(newLayout.layout)) {
                alert('Layout is not valid!');
            }
            else if (!model.isEqual(newLayout.layout)) {
                model.setLayout(newLayout.layout);
            }
        }
    
        function stringToLayout(str) {
            try {
                const size = model.getSize();
                const json = JSON.parse(str);
                if (isUndefined(json.tiles)) {
                    return { error: true, msg: 'Tiles is not defined in the JSON!' };
                }
                if (!Array.isArray(json.tiles)) {
                    return { error: true, msg: 'Tiles is not an array!' };
                }
                if (json.tiles.length != size * size) {
                    return { error: true, msg: 'Tiles has not the correct length!' };
                }
                const layout = model.getLayout();
                for (let i = 0; i < json.tiles.length; ++i) {
                    if (json.tiles[i] !== ' ' && json.tiles[i] !== '#') {
                        return { error: true, msg: 'Tiles has a unkown character! possible character: " ", "#"' };
                    }
                    const x = i % size;
                    const y = Math.floor(i / size);
                    layout[x][y] = json.tiles[i] === '#';
                }
                return { error: false, layout: layout };
            }
            catch (e) {
                return { error: true, msg: 'String is not a valid JSON!' };
            }
        }
    
        function toFormatedDungeonJsonString(layout) {
    
            const size = model.getSize();
            let tiles = '';
            for (let y = 0; y < size; ++y) {
                let line = '\t\t';
                for (let x = 0; x < size; ++x) {
                    const val = layout[x][y] ? '#' : ' ';
                    if (x != size - 1) {
                        line += `"${val}", `;
                    }
                    else if (y != size - 1) {
                        line += `"${val}",`;
                    }
                    else {
                        line += `"${val}"`;
                    }
                }
                tiles += `${line}\n`;
            }
    
            return `{\n\t"tiles": [\n${tiles}\t]\n}`;
        }

        function parseLayoutFromURL() {

            const urlParams = new URLSearchParams(location.search);
            const queryParse = urlParams.get('parse');
            if (typeof queryParse !== 'string') {
                return;
            }
            const size = model.getSize();
            const layout = [];

            for (let i = 0; i < size; ++i) {
                layout.push([]);
            }

            let binaryLayout = '';
            
            for (const block of chunkString(queryParse, 4)) {
                const binaryBlock =  parseInt(block, 16).toString(2);
                const filledBinaryBlock = ('0'.repeat(size) + binaryBlock).slice(-size);
                binaryLayout += filledBinaryBlock;
            }

            for (let i = 0; i < binaryLayout.length; ++i) {
                const c = binaryLayout[i];
                const x = i % size;
                const y = Math.floor(i / size);
                layout[x][y] = (c === '1') ? true : false;
            }

            return layout;
        }

        function createURLWithLayout() {
            const url = new URL(location.href);
            return `${url.origin}${url.pathname}?parse=${createLayoutForURL()}`;
        }

        function updateQueryStringParam(param, value) {
            const url = new URL(location.href);
            const baseUrl = [url.protocol, '//', url.host, url.pathname].join('');
            const urlQueryString = location.search;
            const newParam = param + '=' + value;
            let params = '?' + newParam;

            // If the "search" string exists, then build params from it
            if (urlQueryString) {
                const keyRegex = new RegExp('([\\?&])' + param + '[^&]*');
                // If param exists already, update it
                if (urlQueryString.match(keyRegex) !== null) {
                    params = urlQueryString.replace(keyRegex, '$1' + newParam);
                } else { // Otherwise, add it to end of query string
                    params = urlQueryString + '&' + newParam;
                }
            }
            window.history.replaceState({}, '', baseUrl + params);
        }

        function createLayoutForURL() {
            
            const size = model.getSize();
            const layout = model.getLayout();
            let urlLayout = '';
            for (let y = 0; y < size; ++y) {
                let block = '';
                for (let x = 0; x < size; ++x) {
                    block += (layout[x][y]) ? '1' : '0';
                }
                const hexaBlock = parseInt(block, 2).toString(16);
                const hexaBlockSize = 4;
                urlLayout += ('0'.repeat(hexaBlockSize) + hexaBlock).slice(-hexaBlockSize);
            }

            return urlLayout;
        }

        function chunkString(str, length) {
            return str.match(new RegExp('.{1,' + length + '}', 'g'));
        }
        
        function isUndefined(o) {
            return typeof o === 'undefined';
        }

        function doWith(o, f) {
            if (!isUndefined(o) && !isUndefined(f)) {
                return f(o);
            }
        }
    }

    return {
        createModel: createModel,
        initUI: initUI
    };
})();

window.ccoDungeonEditor = ccoDungeonEditor;