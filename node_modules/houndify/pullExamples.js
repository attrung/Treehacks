const execSync = require('child_process').execSync;

let examplesSource = 'git@github.com:soundhound/hound-sdk-web-example.git';

// This is being build against internal examples.
if(process.argv[2] === 'internal'){
    examplesSource = 'git@git.soundhound.com:web-dev/hound-sdk-web-example.git';
    // We can build against a custom branch.
    if(process.argv[3] === 'branch'){
        examplesSource = `-b ${process.argv[4]} ${examplesSource}`;
    }
}else if(process.argv[2] === 'branch'){
    examplesSource = `-b ${process.argv[3]} ${examplesSource}`;
}else if(process.argv[2] === 'custom'){
    examplesSource = process.argv[3];
}

if(examplesSource === undefined){
    process.exit(9);
}

execSync('rm -rf example');
execSync(`git clone  ${examplesSource} ./example`);