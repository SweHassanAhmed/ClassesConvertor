import ClassConvertor from "./ClassConvertor.js";
import rxjs from "rxjs";
import fs from "fs-extra";
import lineReader from "line-reader";

export default class ConvertYourClasses {
    constructor(dirPath, outSideToDir) {
        this.dirPath = dirPath;
        this.toDir = undefined;

        if (outSideToDir == undefined) {
            this.toDir = "./DefaultFolder"
        } else {
            this.toDir = outSideToDir;
        }

        this.checkDir(this.toDir);
        this.emptyDestination(this.toDir);

        this.globalDataTypes = new Array();
        this.globalFileNames = new Array();
        this.numberOfFileServed = 0;

        this.indexForChangeDataType = 0;
        this.changeDataTypeSubject = new rxjs.BehaviorSubject(false);
        this.changeDataTypeSubject.subscribe(a => {
            if (a && this.indexForChangeDataType < this.globalFileNames.length) {
                this.changeDataTypeForFile(this.globalFileNames[this.indexForChangeDataType]);
                this.indexForChangeDataType++;
            } else if (a && this.indexForChangeDataType >= this.globalFileNames.length) {
                this.startConvertDataType();
            }
        })

        this.indexForChangeDataType2 = 0;
        this.changeDataTypeSubject2 = new rxjs.BehaviorSubject(false);
        this.changeDataTypeSubject2.subscribe(a => {
            if (a && this.indexForChangeDataType2 < this.filesWithTheDataType.length) {
                this.changeDataTypeForFile2(this.filesWithTheDataType[this.indexForChangeDataType2]);
                this.indexForChangeDataType2++;
            } else if (a && this.indexForChangeDataType2 >= this.filesWithTheDataType.length) {
                //console.log(`Final Done.`);
            }
        });

        this.filesWithTheDataType = {};
        this.readFromDirectory();
    }

    changeDataTypeForFile2 = (fileWithData) => {
        //console.log(fileWithData);
        var newLineNumber = 1;
        var newContent = "";
        var arrayOfClassesAdded = [];
        lineReader.eachLine(fileWithData.values.filePath, (line, last) => {
            var newLine = line;
            if (fileWithData.values.numbersOfLine.find(x => x == newLineNumber)) {
                var inLineClassNameIndex = line.indexOf(`//*//`) + 5;
                var inLineClassName = line.slice(inLineClassNameIndex, line.length);
                var object = this.AvailableDataTypes.find(a => a.className == inLineClassName);
                if (object != undefined) {
                    addToArray(object);
                    newLine = newLine.replace(`any`, object.className);
                    newLine = newLine.replace(newLine.slice(newLine.indexOf(`//*//`), newLine.length), ``);
                } else {
                    newLine = newLine.replace(newLine.slice(newLine.indexOf(`//*//`), newLine.length), ``);
                }
            }

            newContent += `\n${newLine}`;
            if (last) {
                var importSection = "";
                arrayOfClassesAdded.forEach(f => {
                    var importFileName = f.fileName.slice(0, f.fileName.indexOf(`.`));
                    importSection += `import ${f.className} from './${importFileName}';\n`;
                });

                var lastNewContent = importSection;

                lastNewContent += newContent;

                this.addToFile(lastNewContent, fileWithData.values.filePath);

                this.changeDataTypeSubject2.next(true);
            }
            newLineNumber++;
        });

        function addToArray(object) {
            if (arrayOfClassesAdded.findIndex(v => v.className == object.className) == -1) {
                arrayOfClassesAdded.push(object);
            }
        }
    }

    addToFile = (content, fileName) => {
        fs.writeFile(fileName, content, () => {});
    }

    startConvertDataType = () => {
        var oldArray = {};
        oldArray = Object.assign({}, this.filesWithTheDataType);
        this.filesWithTheDataType = [];
        //console.log(oldArray);
        for (const property in oldArray) {
            if (oldArray[property].numbersOfLine.length > 0) {
                this.filesWithTheDataType.push({
                    fileName: property,
                    values: Object.assign({}, oldArray[property])
                });
            }
        }

        //console.log("WWW", this.filesWithTheDataType);

        this.AvailableDataTypes = this.changeToDataType(this.globalFileNames);
        this.changeDataTypeSubject2.next(true);
    }

    changeToDataType(fileNames) {
        var newArrayToDataTypes = new Array(0);
        fileNames.forEach(a => {
            newArrayToDataTypes.push({
                className: this.gettingClassName(a),
                fileName: a
            });
        });
        return newArrayToDataTypes;
    }

    checkDir(path) {
        if (!fs.exists(path, () => {})) {
            var createdPath = path;
            var lastIndex = path.lastIndexOf("/");
            var dirName = path.slice(lastIndex + 1, path.length);

            if (lastIndex != -1) {
                var newPath = path.slice(0, lastIndex);
                this.checkDir(newPath);
            }

            fs.mkdir(path, () => {});
        }
    }

    emptyDestination(path) {
        fs.readdir(path, (err, fileNames) => {
            if (fileNames instanceof Array) {
                fileNames.forEach(a => {
                    var filePath = `${path}/${a}`;
                    fs.unlink(filePath, () => {});
                });
            }
        });
    }

    addingToGlobalDataTypes = (arr, index, fileName) => {
        this.numberOfFileServed++;
        if (arr != undefined && arr instanceof Array) {
            arr.forEach(a => {
                if (a != undefined) {
                    if (this.globalDataTypes.findIndex(c => c == a) == -1) {
                        this.globalDataTypes.push(a);
                    }
                }
            });

            if (this.globalFileNames.findIndex(c => c == fileName) == -1) {
                this.globalFileNames.push(fileName);
            }
        }

        if (this.numberOfFileServed == this.numberOfFiles) {
            //this.reAddingClassNames();
            this.changeDataTypeSubject.next(true);
        }
    }

    gettingFileName = (className) => {
        var newString = className.charAt(0).toLowerCase();

        for (let index = 1; index < className.length; index++) {
            if (className.charAt(index).toUpperCase() == className.charAt(index)) {
                if (!isNaN(className.charAt(index))) {
                    newString += className.charAt(index);
                } else {
                    newString += `-` + className.charAt(index).toString().toLowerCase();
                }
            } else {
                newString += `${className.charAt(index)}`;
            }
        }

        return newString += `.ts`;
    }

    gettingNumberOfDash = (fileName) => {
        var numberOfDashes = 0;
        for (let index = 0; index < fileName.length; index++) {
            if (fileName.charAt(index) == `-`) {
                numberOfDashes++;
            }
        }
        return numberOfDashes;
    }

    gettingClassName = (fileName) => {
        var numberOfDashes = this.gettingNumberOfDash(fileName);
        fileName = fileName.replace(fileName.charAt(0), fileName.charAt(0).toUpperCase());

        for (let index = 0; index < numberOfDashes; index++) {
            var nextIndex = fileName.indexOf(`-`);
            fileName = fileName.replace(`${fileName.charAt(nextIndex)}${fileName.charAt(nextIndex + 1)}`, fileName.charAt(nextIndex + 1).toUpperCase());
        }
        var indexOfDot = fileName.indexOf(`.`);
        fileName = fileName.slice(0, indexOfDot);
        return fileName;
    }

    changeDataTypeForFile = (fileName) => {
        this.filesWithTheDataType[fileName] = {};
        this.filesWithTheDataType[fileName].filePath = `${this.toDir}/${fileName}`;
        this.filesWithTheDataType[fileName].numbersOfLine = new Array(0);

        var lineNumber = 1;
        lineReader.eachLine(`${this.toDir}/${fileName}`, (line, last) => {
            // console.log(lineNumber);
            // console.log(line);
            if (line.includes(`//*//`)) {
                this.filesWithTheDataType[fileName].numbersOfLine.push(lineNumber);
            }

            if (last) {
                this.changeDataTypeSubject.next(true);
            }

            lineNumber++;
        });
    }

    // Main Function Of The Application
    readFromDirectory = () => {
        fs.readdir(this.dirPath, (err, fileName) => {
            if (err) {
                console.log(err);
            }

            this.files = new Array();
            this.files = fileName;
            this.scanFilesFromArray();
        });
    }

    scanFilesFromArray() {
        var newFiles = this.files.filter(a => a.includes('.cs'));
        this.numberOfFiles = newFiles.length;
        newFiles.forEach((a, index) => {
            var obj = new ClassConvertor(index + 1);
            obj.startExecuation(this.dirPath, a, this.toDir);
            obj.subject.subscribe(c => {
                if (typeof c == "object") {
                    this.addingToGlobalDataTypes(c.arr, c.index, c.fileName);
                }
            });
        })
    }

}