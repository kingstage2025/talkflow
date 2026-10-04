# TaskFlow

TaskFlow est une application full-stack de gestion de tâches construite avec Node.js, Express, SQLite et JavaScript vanilla.

## Démarrage local

```powershell
npm install
Copy-Item backend\.env.example backend\.env
```

Modifie ensuite `backend/.env` et remplace `JWT_SECRET` par une valeur aléatoire d'au moins 32 caractères.

```powershell
npm run dev
```

L'API démarre sur `http://localhost:3000`. Pour ouvrir le frontend, lance un serveur statique dans `frontend/`, par exemple avec l'extension Live Server de VS Code, sur `http://localhost:8080`.

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks` (JWT)
- `POST /api/tasks` (JWT)
- `PUT /api/tasks/:id` (JWT)
- `DELETE /api/tasks/:id` (JWT)

## Tests et qualité

```powershell
npm test
npm run lint
```

## Docker

```powershell
$env:JWT_SECRET = "une-cle-de-32-caracteres-minimum-pour-docker"
docker compose up --build
```

La base SQLite est conservée dans un volume Docker et le conteneur possède un healthcheck.

## Orientation DevOps après la licence

Ce projet constitue une première base pratique :

1. Git et GitHub : branches, pull requests, revues et tags ;
2. CI : tests et lint à chaque push avec GitHub Actions ;
3. conteneurisation : Docker et Docker Compose ;
4. déploiement : variables d'environnement, healthchecks et logs ;
5. ensuite : Linux, réseaux, reverse proxy Nginx, cloud, Terraform, Kubernetes, observabilité et sécurité DevSecOps.

La prochaine amélioration pédagogique recommandée est de déployer l'API sur Render ou un VPS, puis de mettre le frontend sur Vercel/Netlify.
