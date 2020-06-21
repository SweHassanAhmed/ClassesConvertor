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
import ConvertYourClasses from "classesconvertor3/ConvertYourClasses.js";

var fromPath = "";
var toPath = "";
new ConvertYourClasses(fromPath, toPath);
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

