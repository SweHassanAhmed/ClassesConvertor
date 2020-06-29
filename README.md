# ClassesConvertor

Class Convertor is a nodejs based library for converting classess from .net into angular 8(typescript code)

## Requirement
Each class must be in seprate file
the upload models from .net/.net core EF is perfect for use
except for the DBContext file

## Installation
```bash
npm install classesconvertor3
```

In Your Javascript File 
```javascript
import ConvertYourClasses from "dotnetclassconvertor/ConvertYourClasses.js";

var fromPath = "toDir" // Required;
var toPath = undefined;
new ConvertYourClasses(fromPath, toPath, true);
```

the first parameter is the destination file 
the second optional parameter is the destination where new typescript file will be stored
    with deafult value to ./DefaultDirectory
the third optional parameter if the model files has more than one class in single file
TRUE  --> May be files have some multiple classes
FALSE --> Every file has its own class 

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

