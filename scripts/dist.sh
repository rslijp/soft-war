#/bin/sh
pwd
#$(cd frontend && npm install && npm run build)
cd frontend
npm install
npm run build
cd -

#$(cd backend && rsync -arhv --exclude 'node_modules/' . ../../softwar-dist)
pwd
cd backend
rsync -arhv --exclude 'node_modules/' . ../../softwar-dist
cd -