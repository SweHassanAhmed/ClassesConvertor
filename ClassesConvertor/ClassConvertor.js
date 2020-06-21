import rxjs from "rxjs";
import lineReader from "line-reader";
import fs from "fs-extra";

export default class ClassConvertor {

    startExecuation = (filePath, fileName, previousPathName) => {
        this.classContent = "export default class ";

        this.readingFromFile = `${filePath}/${fileName}`;
        this.previousPath = previousPathName;

        this.toFile = undefined;
        this.className = undefined;

        this.finalClassContentIndex = -1;
        this.finalClassContent = new Array(0);

        this.listOfDataTypes = new Array();
        this.startReading();
    }

    constructor(index) {
        this.subject = new rxjs.BehaviorSubject();
        this.fileIndex = index;
    }

    writingIntoTheFiles = () => {
        var fileContent = this.finalClassContent[this.finalClassContentIndex].firstLine;

        if (this.finalClassContent[this.finalClassContentIndex].propertyArray &&
            this.finalClassContent[this.finalClassContentIndex].propertyArray instanceof Array) {
            this.finalClassContent[this.finalClassContentIndex].propertyArray.forEach(a => {
                fileContent += a;
            });
        }

        fileContent += this.finalClassContent[this.finalClassContentIndex].constructorContent;
        fileContent += this.finalClassContent[this.finalClassContentIndex].finalLine;

        fs.writeFile(this.toFile, fileContent, (a) => {});

        var tempDataTypes = this.listOfDataTypes.slice();

        this.listOfDataTypes = new Array();
        this.classContent = "export default class ";

        this.subject.next({
            arr: tempDataTypes.map(b => b.originalDataType),
            index: this.fileIndex,
            fileName: this.singleFileName,
        });
    }

    startReading = () => {
        lineReader.eachLine(this.readingFromFile, (line, endOfFile) => {
            if (line.includes(' class ')) {
                if (this.toFile != undefined) {
                    this.addingTheConstructor();
                    this.addingFinalLine();
                }
                this.gettingClassName(line);
            } else if (line.includes('public ') && line.includes('get;') && line.includes('set;')) {
                this.addingNewProperty(this.gettingVariableData(line));
            }

            if (endOfFile) {
                this.addingTheConstructor();
                this.addingFinalLine();
            }
        });
    }

    addingClassName = (className) => {
        this.finalClassContentIndex++;
        this.classContent += `${className} {`;
        this.finalClassContent[this.finalClassContentIndex] = {};
        this.finalClassContent[this.finalClassContentIndex].firstLine = this.classContent;
    }

    addingNewProperty = (propObj) => {
        var _propertyName = propObj.propertyName;
        var _dataType = propObj.dataType;

        //Getting DataType And Orignal DataType
        var dataType = this.convertDataType(_dataType);
        var propertyName = this.fixPropertyName(_propertyName);

        dataType.propertyName = propertyName;

        this.listOfDataTypes.push(Object.assign({}, dataType));

        var newLine = `\n\tpublic ${propertyName}: ${dataType.dataType};`;

        if (dataType.originalDataType != undefined) {
            newLine += `\t//*//${dataType.originalDataType}`;
        }

        if (this.finalClassContent[this.finalClassContentIndex].propertyArray == undefined) {
            this.finalClassContent[this.finalClassContentIndex].propertyArray = new Array();
            this.finalClassContent[this.finalClassContentIndex].propertyArray.push(newLine);
        } else if (this.finalClassContent[this.finalClassContentIndex].propertyArray &&
            this.finalClassContent[this.finalClassContentIndex].propertyArray instanceof Array) {
            this.finalClassContent[this.finalClassContentIndex].propertyArray.push(newLine);
        }

    }

    addingTheConstructor = () => {
        var constructorContent = `\n\n\tconstructor() {`;
        var listToLoop = this.listOfDataTypes.filter(a => a.initalize);
        listToLoop.forEach(a => {
            constructorContent += `\n\t\tthis.${a.propertyName} = new ${a.dataType}();`;
            if (a.originalDataType != undefined) {
                constructorContent += `\t//*//${a.originalDataType}`;
            }
        });

        constructorContent += `\n\t}`;

        this.finalClassContent[this.finalClassContentIndex].constructorContent = constructorContent;
    }

    addingFinalLine = () => {
        this.finalClassContent[this.finalClassContentIndex].finalLine = `\n}`;
        this.writingIntoTheFiles();
    }

    gettingClassName = (line) => {
        var index = line.indexOf('class ');
        var nameFirstIndex = index + 6;

        var spaceIndexAfterName = line.indexOf(' ', nameFirstIndex);
        if (spaceIndexAfterName == -1) {
            spaceIndexAfterName = line.indexOf('{', nameFirstIndex);
            if (spaceIndexAfterName == -1) {
                spaceIndexAfterName = line.length;
            }
        }

        var className = line.slice(nameFirstIndex, spaceIndexAfterName);

        if (this.toFile == undefined) {
            var _fileName = this.getFileName(className);
            this.assignFileName(_fileName);
        } else {
            var _fileName = this.getFileName(className);
            if (_fileName != this.toFile) {
                this.assignFileName(_fileName);
            }
        }

        this.className = className;
        this.addingClassName(this.className);
    }

    getFileName = (string) => {
        var i = 0;
        var className = string.charAt(i).toLowerCase();
        i++;
        while (i < string.length) {
            if (string.charAt(i).toUpperCase() == string.charAt(i)) {
                if (!isNaN(string.charAt(i))) {
                    className += string.charAt(i);
                } else {
                    className += `-` + string.charAt(i).toString().toLowerCase();
                }
            } else {
                className += string.charAt(i);
            }
            i++;
        }

        className += `.ts`;
        this.singleFileName = className;
        return className;
    }

    assignFileName = (className) => {
        this.toFile = this.previousPath == undefined ? `` : `${this.previousPath}/`;
        this.toFile += `${className}`;
    }

    gettingVariableData = (line) => {
        var index = line.indexOf('public ');

        var numberOfIndexes = 7;
        if (line.includes(`public virtual `)) {
            numberOfIndexes = 15;
        }

        var firstIndexOfDataType = index + numberOfIndexes;
        var spaceIndexAfterDataType = line.indexOf(' ', firstIndexOfDataType);
        var dataType = line.slice(firstIndexOfDataType, spaceIndexAfterDataType);

        var propertyNameIndexStart = spaceIndexAfterDataType + 1;
        var propertyNameIndexEnd = line.indexOf(' ', propertyNameIndexStart);
        var propertyName = line.slice(propertyNameIndexStart, propertyNameIndexEnd);

        return {
            dataType,
            propertyName
        };
    }

    fixPropertyName = (propertyName) => {
        var propertyName = propertyName;
        if (propertyName.charAt(0).toUpperCase() == propertyName.charAt(0)) {
            propertyName = propertyName.replace(propertyName.charAt(0), propertyName.charAt(0).toLowerCase());
        }
        return propertyName;
    }

    convertDataType = (_dataType) => {
        var dataType = ``;
        var initalize = false;
        var originalDataType = undefined;

        if (
            _dataType == `byte` ||
            _dataType == `byte?` ||
            _dataType == `int` ||
            _dataType == `int?` ||
            _dataType == `short` ||
            _dataType == `short?` ||
            _dataType == `long` ||
            _dataType == `long?` ||
            _dataType == `sbyte` ||
            _dataType == `sbyte?` ||
            _dataType == `ushort` ||
            _dataType == `ushort?` ||
            _dataType == `uint` ||
            _dataType == `uint?` ||
            _dataType == `ulong` ||
            _dataType == `ulong?` ||
            _dataType == `float` ||
            _dataType == `float?` ||
            _dataType == `double` ||
            _dataType == `double?` ||
            _dataType == `decimal` ||
            _dataType == `decimal?`
        ) {
            dataType = `number`;
        } else if (
            _dataType == `string` ||
            _dataType == `char`
        ) {
            dataType = `string`;
        } else if (
            _dataType == `bool` ||
            _dataType == `bool?`
        ) {
            dataType = `boolean`;
        } else if (
            _dataType == `DateTime` ||
            _dataType == `DateTime?`
        ) {
            dataType = `Date`;
            initalize = true;
            //originalDataType = `Date`;
        } else if (
            _dataType.includes(`List<`) ||
            _dataType.includes(`IList<`) ||
            _dataType.includes(`IEnumerable<`) ||
            _dataType.includes(`ICollection<`) ||
            _dataType.includes(`DbSet<`) ||
            _dataType.includes(`HashSet<`)
        ) {
            dataType = `Array<any>`;
            initalize = true;
            originalDataType = this.gettingDataTypeBetweenPractices(_dataType);
        } else if (
            _dataType == `TimeSpan?` ||
            _dataType == `TimeSpan`
        ) {
            dataType = `any`;
            initalize = false;
        } else {
            dataType = `any`;
            initalize = false;
            originalDataType = _dataType;
        }

        if (_dataType.includes(`[]`)) {
            dataType = `Array<any>`;
            initalize = true;
            originalDataType = this.gettingDataTypeFromArray(_dataType);
        }

        return {
            dataType,
            initalize,
            originalDataType
        }
    }

    gettingDataTypeFromArray = (dataType) => {
        var firstSquare = dataType.indexOf(`[`);
        return dataType.slice(0, firstSquare);
    }

    gettingDataTypeBetweenPractices = (dataType) => {
        var originalDataType = "";
        if (dataType.includes(`<`) && dataType.includes(`>`)) {
            var firstChar = dataType.indexOf(`<`);
            var lastChar = dataType.indexOf(`>`);
            originalDataType = dataType.slice(firstChar + 1, lastChar);
        }
        return originalDataType;
    }
}