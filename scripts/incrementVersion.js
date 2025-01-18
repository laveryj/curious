const fs = require('fs');

function incrementVersion(commitMessage) {
  const filePath = './version.json';
  const version = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let [major, minor, patch] = version.version.split('.').map(Number);

  if (commitMessage.startsWith('major:')) {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (commitMessage.startsWith('minor:')) {
    minor += 1;
    patch = 0;
  } else if (commitMessage.startsWith('patch:')) {
    patch += 1;
  } else {
    // If no specific prefix, default to a patch increment
    patch += 1;
  }

  version.version = `${major}.${minor}.${patch}`;
  fs.writeFileSync(filePath, JSON.stringify(version, null, 2));
}

const commitMessage = process.argv[2]; // Pass the commit message as an argument
incrementVersion(commitMessage);