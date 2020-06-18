const lineReader = require('line-reader');

let s;

lineReader.eachLine('../../C#TestProject/ClassTest/ClassTest/TestClass.cs', function (line) {
    if (line.includes(' class ')) {
        console.log(gettingClassName(line));
    } else if (line.includes('{ get; set; }')) {
        console.log(gettingVariableData(line));

    }
});

var gettingClassName = (string) => {
    var index = string.indexOf('class ');
    var nameFirstIndex = index + 6;
    var spaceIndexAfterName = string.indexOf(' ', nameFirstIndex);
    var className = string.slice(nameFirstIndex, spaceIndexAfterName);
    return className;
}

var gettingVariableData = (line) => {
    var index = line.indexOf('public ');
    var firstIndexOfDataType = index + 7;
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