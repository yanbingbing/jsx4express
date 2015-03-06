# jsx4express

Fork form [express-jsx](https://github.com/mattlorey/express-jsx), make a litte change.

Express middleware that transforms jsx to js at request time.

Request the .js file and jsx4express will check for a matching filename with a
.jsx extension and transform it to .js.

## Installation

    npm install jsx4express

## Example usage

```javascript
var express = require('express');
var jsxCompile = require('jsx4express');
...
var app = express();
...
app.use(jsxCompile(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
...

```
```html
<script type="text/javascript" src="/path/to/.js"></script>
```

## License

MIT -- see the `LICENCE` file for details
