npx webpack
node --experimental-sea-config sea-config.json
node -e "require('fs').copyFileSync(process.execPath, 'pathgen.exe')"
signtool remove /s pathgen
npx postject pathgen.exe NODE_SEA_BLOB sea-prep.blob `
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

rm sea-prep.blob