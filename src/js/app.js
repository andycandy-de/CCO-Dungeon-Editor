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
    
        model.addListener(update);
    
        update(model.getLayout());
    
        if (typeof uiElements.resetButton !== 'undefined') {
            uiElements.resetButton.addEventListener('click', () => {
                model.reset();
            });
        }
    
        if (typeof uiElements.tilesCheckbox !== 'undefined') {
            uiElements.tilesCheckbox.addEventListener('change', () => {
                updateEditor(model.getLayout());
            });
        }
    
        if (typeof uiElements.borderCheckbox !== 'undefined') {
            uiElements.borderCheckbox.addEventListener('change', () => {
                updateEditor(model.getLayout());
            });
        }
    
        if (typeof uiElements.copyToClipboard !== 'undefined' && typeof uiElements.outputText !== 'undefined') {
            uiElements.copyToClipboard.addEventListener('click', () => {
                if (model.hasAllPaths()) {
                    uiElements.outputText.select();
                    document.execCommand('copy');
                    alert('Dungeon is copied to your clipboard!');
                }
            });
        }
    
        if (typeof uiElements.parseInputButton !== 'undefined') {
            uiElements.parseInputButton.addEventListener('click', () => {
                const str = uiElements.inputText.value;
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
            });
        }
    
        function update(layout) {
            if (typeof uiElements.copyToClipboard !== 'undefined' && model.hasAllPaths()) {
                uiElements.copyToClipboard.disabled = false;
            }
            else {
                uiElements.copyToClipboard.disabled = true;
            }
            updateEditor(layout);
            updateOutputText(layout);
        }
    
        function updateEditor(layout) {
    
            if (typeof uiElements.editor === 'undefined') {
                return;
            }
    
            if (!model.hasAllPaths()) {
                uiElements.editor.classList.add('invalid');
            }
            else {
                uiElements.editor.classList.remove('invalid');
            }
            if (typeof uiElements.tilesCheckbox !== 'undefined' && uiElements.tilesCheckbox.checked) {
                uiElements.editor.classList.add('tiles');
                uiElements.editor.classList.remove('blocks');
            }
            else {
                uiElements.editor.classList.remove('tiles');
                uiElements.editor.classList.add('blocks');
            }
    
            const size = model.getSize();
            const fieldSize = 100 / size;
    
            uiElements.editor.innerHTML = '';
            for (let y = 0; y < size; ++y) {
                const ydiv = document.createElement('div');
                ydiv.style.width = '100%';
                ydiv.style.height = `${fieldSize}%`;
                for (let x = 0; x < size; ++x) {
                    const xdiv = document.createElement('div');
                    xdiv.style.width = `${fieldSize}%`;
                    xdiv.style.height = '100%';
                    xdiv.style.display = 'inline-block';
                    if (typeof uiElements.borderCheckbox !== 'undefined' && uiElements.borderCheckbox.checked) {
                        xdiv.classList.add('bordered');
                    }
    
                    if (layout[x][y]) {
                        xdiv.classList.add('active');
                    }
    
                    if (model.isEditable(x, y)) {
                        xdiv.addEventListener('click', () => {
                            model.swapPos(x, y);
                        });
                    }
                    ydiv.appendChild(xdiv);
                }
    
                uiElements.editor.appendChild(ydiv);
            }
        }
    
        function updateOutputText(layout) {
    
            if (typeof uiElements.outputText === 'undefined') {
                return;
            }
    
            if (!model.hasAllPaths()) {
                uiElements.outputText.value = 'Dungeon is not valid!';
            }
            else {
                uiElements.outputText.value = toFormatedDungeonJsonString(layout);
            }
        }
    
        function stringToLayout(str) {
            try {
                const size = model.getSize();
                const json = JSON.parse(str);
                if (typeof json.tiles === 'undefined') {
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
    }

    return {
        createModel: createModel,
        initUI: initUI
    };
})();

window.ccoDungeonEditor = ccoDungeonEditor;