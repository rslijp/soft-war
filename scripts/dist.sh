#/bin/sh
pwd
#$(cd frontend && npm install && npm run build)
cd frontend
npm install
npm run build
cd -

#$(cd backend && rsync -arhv --exclude 'node_modules/' . ../../soft-war-dist)
pwd
cd backend
rsync -arhv --exclude 'node_modules/' . ../../soft-war-dist
cd -