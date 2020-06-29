import ClassConvertor from "./ClassConvertor.js";
import rxjs from "rxjs";
import fs from "fs-extra";
import lineReader from "line-reader";
import fswin from 'fswin';

export default class ConvertYourClasses {
    constructor(dirPath, outSideToDir, seperateFiles) {
        this.seperateFilesVal = seperateFiles;
        this.destinationFileFound = fs.existsSync(dirPath);

        if (this.destinationFileFound) {
            this.fillData(dirPath, outSideToDir);
            if (this.seperateFilesVal) {
                this.seperateFiles();
            } else {
                this.readFromDirectory();
            }
        } else {
            console.log('%cDestination File Not Found.', 'background: #222; color: #bada55');
        }
    }

    saveToFile(path, fileName, content, numberOfFile) {
        var newFileName = fileName;
        if (numberOfFile) {
            newFileName = fileName.replace('.cs', `${numberOfFile}.cs`);
        }

        if (!fs.existsSync(path)) {
            fs.mkdir(path);
        }

        fswin.setAttributesSync(path, {
            IS_HIDDEN: true
        });

        fs.writeFile(`${path}/${newFileName}`, content, () => {});
    }

    fillData(dirPath, outSideToDir) {
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
                if (this.seperateFilesVal) {
                    fs.remove(this.dirPath, err => {})
                }
            }
        })

        this.indexForChangeDataType2 = 0;
        this.changeDataTypeSubject2 = new rxjs.BehaviorSubject(false);
        this.changeDataTypeSubject2.subscribe(a => {
            if (a && this.indexForChangeDataType2 < this.filesWithTheDataType.length) {
                this.changeDataTypeForFile2(this.filesWithTheDataType[this.indexForChangeDataType2]);
                this.indexForChangeDataType2++;
            }
        });

        this.filesWithTheDataType = {};
    }

    seperateFiles() {
        this.toTempDirSubject = new rxjs.BehaviorSubject(false);
        this.toTempDirArray = new Array();
        this.toTempDirIndex = 0;
        var myNewDir = `MyNewDirectory`;
        this.toTempDirSubject.subscribe(a => {
            if (a) {
                var fileName = this.toTempDirArray[this.toTempDirIndex];
                var wholeBodyOfFile = ``;
                var numberOfFiles = 0;
                lineReader.eachLine(`${this.dirPath}/${fileName}`, (line, last) => {
                    if (line.includes(` class `)) {
                        numberOfFiles++;
                        if (numberOfFiles > 1) {
                            this.saveToFile(`${this.dirPath}/${myNewDir}`, fileName, wholeBodyOfFile, numberOfFiles);
                            wholeBodyOfFile = ``;
                        }
                    }

                    if (last) {
                        this.saveToFile(`${this.dirPath}/${myNewDir}`, fileName, wholeBodyOfFile);
                    }

                    wholeBodyOfFile += `${line}\n`;
                    if (last) {
                        this.toTempDirIndex++;

                        if (this.toTempDirIndex != this.toTempDirArray.length) {
                            this.toTempDirSubject.next(true);
                        } else {
                            this.dirPath = `${this.dirPath}/${myNewDir}`;
                            this.readFromDirectory();
                        }
                    }
                });
            }
        });

        if (this.destinationFileFound) {
            fs.readdir(this.dirPath, (err, fileNames) => {
                this.toTempDirArray.push(...(fileNames.filter(a => a.endsWith(`.cs`))));
                this.toTempDirSubject.next(true);
            });
        }
    }

    changeDataTypeForFile2 = (fileWithData) => {
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
            if (arrayOfClassesAdded.findIndex(v => v.className == object.className) == -1 &&
                fileWithData.fileName != object.fileName) {
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
        for (const property in oldArray) {
            if (oldArray[property].numbersOfLine.length > 0) {
                this.filesWithTheDataType.push({
                    fileName: property,
                    values: Object.assign({}, oldArray[property])
                });
            }
        }

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
        if (this.destinationFileFound) {
            fs.readdir(this.dirPath, (err, fileName) => {
                if (err) {}

                this.files = new Array();
                this.files = fileName;
                this.scanFilesFromArray();
            });
        }
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