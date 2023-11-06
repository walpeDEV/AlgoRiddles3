const canvas = document.getElementById('canvas'),
ctx = canvas.getContext('2d');

var sudkoField = [];
const thermometers = [
    [
        [0,0],
        [1,0]
    ],
    [
        [4,1],
        [5,2]
    ],
    [
        [6,1],
        [5,0]
    ],
    [
        [7,1],
        [8,0]
    ],
    [
        [0,2],
        [1,3],
        [2,3],
        [3,4]
    ],
    [
        [6,2],
        [5,3],
        [4,3]
    ],
    [
        [8,2],
        [8,3]
    ],
    [
        [1,5],
        [1,4]
    ],
    [
        [2,5],
        [2,4]
    ],
    [
        [4,5],
        [4,4]
    ],
    [
        [5,5],
        [5,4],
        [6,3]
    ],
    [
        [3,7],
        [2,7],
        [2,8]
    ],
    [
        [6,7],
        [5,7],
        [5,6]
    ],
    [
        [8,7],
        [8,8]
    ],
    [
        [0,8],
        [0,7],
        [0,6]
    ]
];

var thermometersObj = [];

for(let i = 0; i < 9; i++) {
    sudkoField[i] = [];
}

sudkoField[8][0] = 9;
// sudkoField[0][8] = 9;
sudkoField[6][2] = 4;
sudkoField[4][4] = 4;
sudkoField[8][6] = 5;
sudkoField[8][8] = 4;

let breakAtEnd = true;


let maxIrritations = 200;
let openedBacktracks = 0;
let startTime = 0;
let endTime = 0;

let results = [];

let lastIrritationChanged=true;
let backTrack = {
    oldSudoku: undefined,
    oldBackTrack: undefined,

    canNotWork: [],

    counter1: 2,
    counter2: 0,
    counter3: 0
}
// let minMinCellPossible;
// let minCellPossible;
let cellsPossibles;
let backTracks = 0;
let counterBackTrackPlus;
let irritation = 0;

const drawSudoku = function() {
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let sudokuSize = width>height?height:width;

    ctx.fillStyle = 'white';

    sudokuSize-=200;
    ctx.textAlign = "center";
    let xOffset = (width-sudokuSize)/2;
    let yOffset = (height-sudokuSize)/2;
    let cellSize = sudokuSize/9;
    
    let fontSize = cellSize-5;
    ctx.font = `${fontSize}px Arial`;

    
    ctx.fillRect(xOffset-cellSize/2,yOffset,sudokuSize,sudokuSize);

    ctx.strokeStyle = ctx.fillStyle ='lightgrey';
    ctx.lineWidth = 8;
    for(let i in thermometers) {
        let thermometer = thermometers[i];
        ctx.beginPath();
        for(let j in thermometer) {
            let tX = xOffset+cellSize*thermometer[j][0];
            let tY = yOffset+cellSize*thermometer[j][1]+cellSize/2;
            if(j==0) ctx.moveTo(tX,tY);
            else ctx.lineTo(tX,tY);
        }
        ctx.stroke();
        ctx.beginPath();
        let tX = xOffset+cellSize*thermometer[0][0];
        let tY = yOffset+cellSize*thermometer[0][1]+cellSize/2;
        ctx.moveTo(tX+cellSize*0.2,tY);
        ctx.arc(tX,tY,cellSize*0.4,0,Math.PI*2);
        ctx.fill();
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';

    ctx.textBaseline = 'middle';
    for(let x = 0; x < 9; x++) {
        for(let y = 0; y < 9; y++) {
            let text = sudkoField[x][y]===undefined?"":sudkoField[x][y];
            ctx.fillText(text,x*cellSize+xOffset,y*cellSize+yOffset+cellSize/2);

            if(x===0) {
                ctx.lineWidth = y%3===2?3:1;
                ctx.beginPath();
                let yStroke = Math.floor(y*cellSize+yOffset+cellSize);
                ctx.moveTo(xOffset-cellSize/2,yStroke);
                ctx.lineTo(xOffset+cellSize*8.5,yStroke);
                ctx.stroke();
            }
        }
        ctx.lineWidth = x%3===2?3:1;
        ctx.beginPath();
        let xStroke = Math.floor(x*cellSize+xOffset+cellSize/2);
        ctx.moveTo(xStroke,yOffset);
        ctx.lineTo(xStroke,yOffset+9*cellSize);
        ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3;
    ctx.font = `20px Arial`;

    ctx.beginPath();
    let xStroke = Math.floor((-1)*cellSize+xOffset+cellSize/2);
    ctx.moveTo(xStroke,yOffset-1);
    ctx.lineTo(xStroke,yOffset+9*cellSize+1);
    ctx.stroke();

    ctx.beginPath();
    let yStroke = Math.floor(-1*cellSize+yOffset+cellSize);
    ctx.moveTo(xOffset-cellSize/2-1,yStroke);
    ctx.lineTo(xOffset+cellSize*8.5+1,yStroke);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.fillText(irritation,100,100)
    ctx.fillText(openedBacktracks,100,140)
    ctx.fillText(backTracks,100,180)

    let time = endTime-startTime;
    let milliseconds = time%1000;
    let seconds = Math.floor((time/1000)%60);
    let minute = Math.floor(time/60000)
    ctx.fillText(`${minute}m ${seconds}s ${milliseconds}ms`,100,240)

};

const checkCell = function(ar,x,y,index) {
    let cell = sudkoField[x][y];
    
    if(cell!==undefined) {
        ar[index].evenOddCounter[cell%2]++;
    }

    for(let t in thermometersObj) {
        let part = thermometersObj[t].isCellPart([x,y]);
        if(part!==-1) {
            if(ar[index].thermoStatesCells[t]===undefined) ar[index].thermoStatesCells[t] = 1;
            else ar[index].thermoStatesCells[t]++;
            let thermoState = thermometersObj[t].getState();
            if(thermoState!==Thermometer.STATE_TYPES.notDefined&&cell===undefined) ar[index].evenOddCounter[thermoState]++;
            break;
        }
    }
}

const checkThermos = function(ar) {
    let maxEvenOdd = [4,5];
    maxEvenOdd[0]-=ar.evenOddCounter[0];
    maxEvenOdd[1]-=ar.evenOddCounter[1];
    for(let t in ar.thermoStatesCells) {
        if(ar.thermoStatesCells[t]>0) {
            if(thermometersObj[t].getState()!==Thermometer.STATE_TYPES.notDefined) continue;
            for(let i in maxEvenOdd) {
                if(ar.thermoStatesCells[t]>maxEvenOdd[i]) {
                    thermometersObj[t].setState((i+1)%2);
                    break;
                }
            }
        }
    }
}

const cloneThermo = function(thermos,invert) {
    let newObj = [];
    if(invert) {
        for(let i in thermos) {
            let thermo = thermos[i];
            newObj[i] = new Thermometer();
            newObj[i].setState(thermo.state);
            for(let c in thermo.cells) {
                let cell = thermo.cells[c];
                let cellAr = [cell[0],cell[1]];

                newObj[i].addCell(cellAr);


                // console.log(c,cell[1]);
                if(cell[2]!==undefined) newObj[i].addValue(c,cell[2]);
            }
        }
        return newObj;
    }
    for(let i in thermos) {
        let thermo = thermos[i];
        let cellsNew = []
        let cells = thermo.getCells();
        for(let c in cells) {
            let cell = cells[c];
            cellsNew[c] = [cell.x,cell.y,cell.value];
        }
        // console.log(cellsNew);
        newObj[i] = {
            state: thermo.getState(),
            cells: cellsNew
        };
    }
    return newObj;
}

const solve2 = function() {
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    irritation++;

    // if(irritation%1024===0) {
    //     console.log(irritation);
    // } 

    let log = 0;
    if(!lastIrritationChanged) {
        // console.log(backTrack.counter1,backTrack.counter2,backTrack.counter3);
        // console.log(cellsPossibles);
        // console.log(thermometersObj);
        if(!counterBackTrackPlus) {
            backTrack.oldBackTrack = structuredClone(backTrack);
            backTrack.oldSudoku = structuredClone(sudkoField);
            backTrack.oldBackTrack.cellsPossibles = structuredClone(cellsPossibles);
            backTrack.oldBackTrack.thermoObj = cloneThermo(thermometersObj,false);

            backTrack.canNotWork = structuredClone(backTrack.canNotWork);

            backTrack.counter1 = 2;
            backTrack.counter2 = 0;
            backTrack.counter3 = 0;

            // console.group();
            openedBacktracks++;
            if(cellsPossibles[backTrack.counter1]===undefined) {
                backTrack.counter1++;
                counterBackTrackPlus = true;
                // console.log('1');
                //exit();
                return;
            }
            // console.log('2');
            // console.log('2',cellsPossibles[backTrack.counter1][backTrack.counter2][0],cellsPossibles[backTrack.counter1][backTrack.counter2][1]);
            let cell = cellsPossibles[backTrack.counter1][backTrack.counter2];
            try{
                addCellValue(cell[0],cell[1],cell[2][backTrack.counter3]);
            } catch(e) {


                // cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);
                if(backTrack.canNotWork[cell[0]]===undefined) backTrack.canNotWork[cell[0]] = [];
                if(backTrack.canNotWork[cell[0]][cell[1]]===undefined) backTrack.canNotWork[cell[0]][cell[1]] = [];
                backTrack.canNotWork[cell[0]][cell[1]].push(cell[2][backTrack.counter3]);

                counterBackTrackPlus = true;
                backTrack.counter3++;
                return;
            }
            // thermometersObj
            // console.log(cellsPossibles[backTrack.counter1][backTrack.counter2][2][backTrack.counter3]);
        } else {
            if(cellsPossibles[backTrack.counter1]===undefined||cellsPossibles[backTrack.counter1][backTrack.counter2]===undefined) {
                backTrack.counter1++;
                backTrack.counter2 = 0;
                backTrack.counter3 = 0;
                // console.log('3');
                if(backTrack.counter1>9) {
                    // console.groupEnd();
                    // console.log(backTrack,irritation);
                    backTrack = structuredClone(backTrack.oldBackTrack);
                    sudkoField = structuredClone(backTrack.oldSudoku);
                    // console.log(sudkoField);
                    cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);
                    thermometersObj = cloneThermo(backTrack.oldBackTrack.thermoObj,true)
                    backTrack.counter3++;
                    openedBacktracks--;
                    backTracks++;
                    // console.log(backTrack,irritation,backTrack.counter1,backTrack.counter2,backTrack.counter3);
                    // console.log('4');
                    // return;
                }
                //exit();
                return;
            }
            let cell = cellsPossibles[backTrack.counter1][backTrack.counter2];
            if(cell[2][backTrack.counter3]===undefined) {
                backTrack.counter2++;
                backTrack.counter3 = 0;
                // console.log('5');
                //exit();
                return;
            } else {
                // console.log('6');
                // if(irritation>260) console.log(cellsPossibles);
                try{
                    addCellValue(cell[0],cell[1],cell[2][backTrack.counter3]);
                } catch(e) {
                    
                    if(backTrack.canNotWork[cell[0]]===undefined) backTrack.canNotWork[cell[0]] = [];
                    if(backTrack.canNotWork[cell[0]][cell[1]]===undefined) backTrack.canNotWork[cell[0]][cell[1]] = [];
                    backTrack.canNotWork[cell[0]][cell[1]].push(cell[2][backTrack.counter3]);

                    backTrack.counter3++;
                    return;
                }
                // console.log(cellsPossibles[backTrack.counter1][backTrack.counter2][2][backTrack.counter3]);
            }
        }
        // console.log(thermometersObj);
    }
    // console.log(backTrack.counter1,backTrack.counter2,backTrack.counter3);
    cellsPossibles = [];
    counterBackTrackPlus = false;
    lastIrritationChanged = false;
    let colsAr = [];
    for(let cols = 0; cols < 9; cols++) {
        colsAr[cols] = {
            evenOddCounter: [0,0],
            // numberCounter: [undefined,0,0,0,0,0,0,0,0,0],
            thermoStatesCells: []
        }
        for(let cellIndex = 0; cellIndex < 9; cellIndex ++) {
            checkCell(colsAr,cols,cellIndex,cols);
        }
        // for(let cellIndex = 0; cellIndex < 9; cellIndex++) {
        checkThermos(colsAr[cols]);
        // }
    }
    
    let rowsAr = [];
    for(let rows = 0; rows < 9; rows++) {
        rowsAr[rows] = {
            evenOddCounter: [0,0],
            // numberCounter: [undefined,0,0,0,0,0,0,0,0,0],
            thermoStatesCells: []
        }
        for(let cellIndex = 0; cellIndex < 9; cellIndex ++) {
            checkCell(rowsAr,cellIndex,rows,rows);
        }
        checkThermos(rowsAr[rows]);
    }

    let squaresAr = [];
    for(let square = 0; square < 9; square++) {
        let squareX = square%3;
        let squareY = Math.floor(square/3);
        squaresAr[square] = {
            evenOddCounter: [0,0],
            // numberCounter: [undefined,0,0,0,0,0,0,0,0,0],
            thermoStatesCells: []
        }
        for(let x = 0; x<3;x++) {
            for(let y = 0; y < 3; y++) {
                checkCell(squaresAr,x+squareX*3,y+squareY*3,square);
            }
        }
        checkThermos(squaresAr[square]);
    }

    let definedCounter = 0;

    for(let x in sudkoField) {
        for(let y in sudkoField) {
            if(sudkoField[x][y]!==undefined) {
                definedCounter++;
                continue;
            };
            let canBeNumber = [undefined,1,2,3,4,5,6,7,8,9];
            let colNumber = x;
            let rowNumber = y;
            // let square

            // let row = [];
            // let col = [];
            for(let c in sudkoField[colNumber]) {
                if(sudkoField[colNumber][c]!==undefined) canBeNumber[sudkoField[colNumber][c]] = undefined;
            }
            for(let r = 0; r < 9; r++) {
                if(sudkoField[r][rowNumber]!==undefined) canBeNumber[sudkoField[r][rowNumber]] = undefined;
            }
            let x2 = Math.floor(x/3);
            let y2 = Math.floor(y/3);
            for(let x1 = 0; x1 < 3; x1++) {
                for(let y1 = 0; y1 < 3; y1++) {
                    if(sudkoField[x1+x2*3][y1+y2*3]!==undefined) canBeNumber[sudkoField[x1+x2*3][y1+y2*3]] = undefined;                        
                }
            }
            let isInThermometer = undefined;
            for(let t in thermometersObj) {
                let cellIndex = thermometersObj[t].isCellPart([x,y])
                if(cellIndex>-1) {
                    isInThermometer = {
                        index: t,
                        cellIndex: cellIndex
                    };
                    for(let j in canBeNumber) {
                        if(canBeNumber[j]!==undefined) {
                            if(!thermometersObj[t].isValuePossible(cellIndex,canBeNumber[j])) canBeNumber[j]=undefined;
                        } 
                    }
                }
            }

            if(backTrack.canNotWork[x]!==undefined) {
                if(backTrack.canNotWork[x][y]!==undefined) {
                    for(let i in backTrack.canNotWork[x][y]) {
                        canBeNumber[backTrack.canNotWork[x][y][i]]=undefined;
                    }
                }
            }

            let canBeNumber2 = [];
            let evenOddCounter = [0,0]
            for(let j in canBeNumber) {
                if(canBeNumber[j]!==undefined) {
                    canBeNumber2.push(canBeNumber[j]);
                    evenOddCounter[canBeNumber[j]%2]++;
                }
            }
            if(evenOddCounter[0]===0&&isInThermometer!==undefined) thermometersObj[isInThermometer.index].setState(1);
            if(evenOddCounter[1]===0&&isInThermometer!==undefined) thermometersObj[isInThermometer.index].setState(0);

            let cellL = canBeNumber2.length;
            if(cellL===1) {
                // if(irritation>260) console.log(x,y,canBeNumber2);
                addCellValue(x,y,canBeNumber2[0]);
                // console.log()
                lastIrritationChanged = true;
                //exit();
                return;
            } else if(cellL===0) {
                if(backTrack.oldSudoku!==undefined) {
                    backTracks++;

                    cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);
                    let notWorked = cellsPossibles[backTrack.counter1][backTrack.counter2];
                    if(backTrack.canNotWork[notWorked[0]]===undefined) backTrack.canNotWork[notWorked[0]] = [];
                    if(backTrack.canNotWork[notWorked[0]][notWorked[1]]===undefined) backTrack.canNotWork[notWorked[0]][notWorked[1]] = [];
                    backTrack.canNotWork[notWorked[0]][notWorked[1]].push(notWorked[2][backTrack.counter3]);

                    sudkoField = structuredClone(backTrack.oldSudoku);
                    // cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);
                    thermometersObj = cloneThermo(backTrack.oldBackTrack.thermoObj,true)
                    backTrack.counter3++;
                    lastIrritationChanged = false;
                    counterBackTrackPlus = true;
                    // console.log(x,y);
                    //exit();
                    return;
                }
                else {
                    // console.log('Häh2');
                    return 'Error';
                }
            } else {
                if(cellsPossibles[cellL]===undefined) cellsPossibles[cellL] = [];
                cellsPossibles[cellL].push([x,y,canBeNumber2]);
            }
        }
    }
    if(definedCounter>80) {
        if(!breakAtEnd) {
            results.push(structuredClone(sudkoField));

            cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);

            let notWorked = cellsPossibles[backTrack.counter1][backTrack.counter2];
            if(backTrack.canNotWork[notWorked[0]]===undefined) backTrack.canNotWork[notWorked[0]] = [];
            if(backTrack.canNotWork[notWorked[0]][notWorked[1]]===undefined) backTrack.canNotWork[notWorked[0]][notWorked[1]] = [];
            backTrack.canNotWork[notWorked[0]][notWorked[1]].push(notWorked[2][backTrack.counter3]);

            sudkoField = structuredClone(backTrack.oldSudoku);
            // cellsPossibles = structuredClone(backTrack.oldBackTrack.cellsPossibles);
            thermometersObj = cloneThermo(backTrack.oldBackTrack.thermoObj,true)
            backTrack.counter3++;
            lastIrritationChanged = false;
            counterBackTrackPlus = true;
        }
        return 'Found';
    }
    irritation++;
    //exit();
};

const addCellValue = function(x,y,value) {
    for(let t in thermometersObj) {
        let part = thermometersObj[t].isCellPart([x,y]);
        if(part!==-1) {
            thermometersObj[t].addValue(part,value);
        }
    }
    sudkoField[x][y] = value;
}

const exit = function() {
    while(true) {
        let res = solve2();
        if(res === 'Found') {
            if(breakAtEnd) break;
            let endTime = (new Date()).getTime();
            console.log(`Found Result after: ${(endTime-startTime)/1000}`);
            console.log(`Results:`, results);
        } else if(res === 'Error') break;
    }
    endTime = (new Date()).getTime();
    drawSudoku();
    // window.setTimeout(solve2,10);
}

const solve = function() {
    let startDate = new Date();
    console.log(startDate);
    startTime = startDate.getTime();
    irritation = 0;
    maxIrritations = 2
    lastIrritationChanged=true;
    backTrack = {
        oldSudoku: undefined,
        oldBackTrack: undefined,

        canNotWork: [],

        counter1: 2,
        counter2: 0,
        counter3: 0
    }
    // let minMinCellPossible;
    // let minCellPossible;
    cellsPossibles;
    backTracks = 0;
    counterBackTrackPlus;
    exit();
    // loopIr: for(let irritation = 0; irritation < maxIrritations; irritation++) {
    //     /*
    //     for(let cols = 0; cols < 9; cols++) {

    //     }
        
    //     let rowsAr = [];
    //     for(let rows = 0; rows < 9; rows++) {
    //         rowsAr[rows] = [
    //             0,0
    //         ]
    //         for(let cellIndex = 0; cellIndex < 9; cellIndex ++) {
    //             let cell = sudkoField[cellIndex][rows];
    //             if(cell!==undefined) rowsAr[rows][cell%2]++;
    //         }
    //     }
    //     console.log(colsAr,rowsAr);*/
    // }
};

for(let i in thermometers) {
    thermometersObj[i] = new Thermometer();
    for(let c in thermometers[i]) {
        let cell = thermometers[i][c];
        thermometersObj[i].addCell(cell);
        if(sudkoField[cell[0]][cell[1]]!==undefined) thermometersObj[i].addValue(Number(c),sudkoField[cell[0]][cell[1]]);
    }
}

const start = function() {
    solve();
}

// window.addEventListener('keydown', e => {
//     if(irritation===260) alert('Stop');
//     solve2();
// });

// window.onload = start;

