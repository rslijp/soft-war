#/bin/sh
pwd
#$(cd frontend && npm install && npm run build)
cd frontend
npm install
npm run build
cd -

#$(cd backend && rsync -arhv --exclude 'node_modules/' . ../../soft-war-dist)

cd shared
rsync -arhv --exclude 'node_modules/' . ../../soft-war-dist/shared
cd -

cd backend
rsync -arhv --exclude 'node_modules/' . ../../soft-war-dist
cd -

sed -i -e 's/file:..\/shared/file:.\/shared/g' ../soft-war-dist/package.json