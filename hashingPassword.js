const bcrypt = require('bcrypt');

(async function main () {
    const salt = "$2b$10$TBx7fI7TfQ9JvzvDlcHDd.";
    const originalPassword1 = "Arsenal2015@";
    const hashPassword1 = await bcrypt.hash(originalPassword1, salt);
    console.log(hashPassword1);
})();