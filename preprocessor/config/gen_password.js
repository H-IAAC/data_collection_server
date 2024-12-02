const bcrypt = require("bcryptjs");

// parse command line args
const args = process.argv.slice(2);


if (args[0]) {
    console.log("args[0]: " + args[0])
    password = args[0];

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            console.log("HASH: " + hash);
        });
    });


} else {
    console.log("Missing password paramenter");
    return;
}
