class Thermometer {
    #cells = [];
    #state;
    static STATE_TYPES = {
        even: 0,
        odd: 1,
        notDefined: 2
    }
    constructor() {
        this.#state = Thermometer.STATE_TYPES.notDefined;
    }
    addCell(cell) {
        if(cell===undefined||!Array.isArray(cell)||cell.length!==2) throw new TypeError("Can't add Cell to Thermometer, because Argument is not of Type Cell");
        for(let i = 0; i < 2; i++) {
            if(isNaN(cell[i])||cell[i]<0||cell[i]>=9) throw new TypeError("Can't add Cell to Thermometer, because surpassed cells contains not a number, or is out of Range.");
            cell[i] = Math.floor(cell[i]);
        }
        let addCell = {};
        addCell.x = cell[0];
        addCell.y = cell[1];
        addCell.value = undefined;
        this.#cells.push(addCell);
    }
    getCells() {
        return structuredClone(this.#cells);
    }
    getState() {
        return this.#state;
    }
    setState(s) {
        let notFound = true;
        for(let i in Thermometer.STATE_TYPES) {
            if(Thermometer.STATE_TYPES[i]===s) notFound=false;
        }
        if(notFound) throw new TypeError("Can't change state of Thermometer, because surpasse state has not a allowed value.");
        this.#state = s;
    }
    isCellPart(cell) {
        if(cell===undefined||!Array.isArray(cell)||cell.length!==2) throw new TypeError("Can't add Cell to Thermometer, because Argument is not of Type Cell");
        for(let i = 0; i < 2; i++) {
            if(isNaN(cell[i])||cell[i]<0||cell[i]>=9) throw new TypeError("Can't add Cell to Thermometer, because surpassed cells contains not a number, or is out of Range.");
            cell[i] = Math.floor(cell[i]);
        }
        for(let i in this.#cells) {
            let thisCell = this.#cells[i]
            if(thisCell.x===cell[0]&&thisCell.y===cell[1]) return Number(i);
        }
        return -1;
    }
    addValue(cellIndex,value) {
        if(!this.isValuePossible(cellIndex,value)) throw new Error("Can't add Value to Thermometer-Cell, because it's not a valid value." + cellIndex + value);
        value = Math.floor(value);
        if(this.#state===Thermometer.STATE_TYPES.notDefined) {
            this.#state = value%2;
        }
        this.#cells[cellIndex].value = value;
    }
    isValuePossible(cellIndex,value,log) {
        if(isNaN(value)||value<=0||value>=10) return false;
        value = Math.floor(value);
        let stateValue = this.#state;
        if(stateValue!==Thermometer.STATE_TYPES.notDefined) {
            if(value%2!==stateValue) return false;
        }
        else stateValue = value%2;
        for(let i in this.#cells) {
            let cellValue = this.#cells[i].value;
            if(cellValue!==undefined) {
                if(i<cellIndex) {
                    if(cellValue>=value) return false;
                    let dif = (value-cellValue)/2;
                    let difCellI = cellIndex-i;
                    // if(cellIndex!==0&&cellIndex!==this.#cells.length)
                        if(difCellI>dif) return false;
                }
                if(i>cellIndex) {
                    if(cellValue<=value) return false;
                    let dif = (cellValue-value)/2;
                    let difCellI = i-cellIndex;
                    // if(cellIndex!==0&&cellIndex!==this.#cells.length)
                        if(difCellI>dif) return false;
                }
            }
        }
        let difToStart = (value-stateValue)/2-1+stateValue;
        if(cellIndex>difToStart) return false;

        let difToEnd = (8-value+stateValue)/2;
        let cellToEndIndex = this.#cells.length-cellIndex-1;
        // if(log) console.log(difToEnd,cellToEndIndex,cellIndex,value);
        if(cellToEndIndex>difToEnd) return false;

        return true;
    }

}