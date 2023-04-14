//import process from 'node:process';
//import { cpuUsage } from 'node:process';
//import { memoryUsage } from 'node:process';

const fs = require('fs');

module.exports = {
  /**
   * @return {json}           Return content from ./config/config.json
   */
  monitor_exit: function () {
    process.on('beforeExit', (code) => {
        console.log('Process beforeExit event with code: ', code);
        console.log(`  Process pid: ${process.pid}`);
        console.log('  cpuUsage: ' + JSON.stringify(process.cpuUsage()));
        console.log('  memoryUsage: ' + JSON.stringify(process.memoryUsage()));
    });

    process.on('exit', (code) => {
        console.log('Process exit event with code: ', code);
    });

    process.on('uncaughtException', (err, origin) => {
        console.log(
          `Caught exception: ${err}\n` +
          `Exception origin: ${origin}`,
        );
      });

      process.on('unhandledRejection', (reason, promise) => {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason);
      });

      process.on('warning', (warning) => {
        console.warn(warning.name);    // 'Warning'
        console.warn(warning.message); // 'Something happened!'
        console.warn(warning.code);    // 'MY_WARNING'
        console.warn(warning.stack);   // Stack trace
        console.warn(warning.detail);  // 'This is some additional information'
      });


    process.on('SIGINT', () => {
        console.log('Received SIGINT. Press Control-D to exit.');
        process.exit();
      });

      // Using a single function to handle multiple signals
    function handle(signal) {
        /*
        'SIGUSR1' is reserved by Node.js to start the debugger. It's possible to install a listener but doing so might interfere with the debugger.
        'SIGTERM' and 'SIGINT' have default handlers on non-Windows platforms that reset the terminal mode before exiting with code 128 + signal number. If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
        'SIGPIPE' is ignored by default. It can have a listener installed.
        'SIGHUP' is generated on Windows when the console window is closed, and on other platforms under various similar conditions. See signal(7). It can have a listener installed, however Node.js will be unconditionally terminated by Windows about 10 seconds later. On non-Windows platforms, the default behavior of SIGHUP is to terminate Node.js, but once a listener has been installed its default behavior will be removed.
        'SIGTERM' is not supported on Windows, it can be listened on.
        'SIGINT' from the terminal is supported on all platforms, and can usually be generated with Ctrl+C (though this may be configurable). It is not generated when terminal raw mode is enabled and Ctrl+C is used.
        'SIGBREAK' is delivered on Windows when Ctrl+Break is pressed. On non-Windows platforms, it can be listened on, but there is no way to send or generate it.
        'SIGWINCH' is delivered when the console has been resized. On Windows, this will only happen on write to the console when the cursor is being moved, or when a readable tty is used in raw mode.
        'SIGKILL' cannot have a listener installed, it will unconditionally terminate Node.js on all platforms.
        'SIGSTOP' cannot have a listener installed.
        'SIGBUS', 'SIGFPE', 'SIGSEGV', and 'SIGILL', when not raised artificially using kill(2), inherently leave the process in a state from which it is not safe to call JS listeners. Doing so might cause the process to stop responding.
        */
        console.log(`Received signal ${signal}`);
      }

    process.on('SIGTERM', handle);
    process.on('SIGUSR1', handle);
    process.on('SIGPIPE', handle);
    process.on('SIGHUP', handle);
    process.on('SIGBREAK', handle);
    process.on('SIGWINCH', handle);
    process.on('SIGBUS', handle);
    process.on('SIGFPE', handle);
    process.on('SIGSEGV', handle);
    process.on('SIGILL', handle);
  }
};