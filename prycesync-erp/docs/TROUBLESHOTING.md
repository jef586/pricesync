# PriceSync ERP - Troubleshooting Guide

## 🚨 Quick Fixes (Resuelve 90% de problemas)

### 1. Complete Reset (El "turn it off and on again" de desarrollo)
```bash
# Parar todo y limpiar completamente
docker-compose down -v
docker system prune -af
docker volume prune -f
rm -rf node_modules package-lock.json
npm cache clean --force

# Rebuild desde cero
docker-compose build --no-cache --pull
docker-compose up

# Si sigue fallando, reiniciar Docker Desktop completamente
```

### 2. Health Check Rápido
```bash
# Verificar versiones críticas
echo "=== System Check ==="
node --version    # Debe ser v20.10.0+
npm --version     # Debe ser 10.2.0+
docker --version  # Debe ser 24.0.0+
docker-compose --version # Debe ser 2.21.0+

# Verificar puertos libres
echo "=== Port Check ==="
netstat -tulpn | grep -E ':(3000|3001|5432|6379)' || echo "Puertos libres ✅"

# Verificar Docker funcionando
echo "=== Docker Check ==="
docker run --rm hello-world && echo "Docker OK ✅"
```

### 3. Dependency Doctor
```bash
# Verificar estado de dependencias
npm run doctor # Script personalizado (ver abajo)
```

---

## 🎨 Problemas de CSS y Estilos

### Tailwind CSS no funciona / Estilos no se aplican

**Síntomas:**
- Los estilos de Tailwind no se aplican
- Warning: "The `content` option in your Tailwind CSS configuration is missing or empty"
- Los componentes no tienen estilos visuales

**Solución:**
1. **Verificar ubicación del archivo de configuración:**
   ```bash
   # El archivo tailwind.config.js DEBE estar en la raíz del proyecto
   # NO en src/renderer/ o cualquier subdirectorio
   ls -la tailwind.config.js  # Debe existir en la raíz
   ```

2. **Verificar configuración de contenido:**
   ```javascript
   // tailwind.config.js (en la raíz del proyecto)
   module.exports = {
     content: [
       "./src/renderer/index.html",
       "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {
         // configuración personalizada
       },
     },
     plugins: [],
   }
   ```

3. **Reconstruir después de cambios:**
   ```bash
   # Siempre reconstruir Docker después de cambios en tailwind.config.js
   docker build -t prycesync-erp .
   docker run -p 5173:5173 -p 3000:3000 prycesync-erp
   ```

**Nota importante:** Vite busca automáticamente `tailwind.config.js` en la raíz del proyecto. Si está en otro lugar, no lo encontrará y los estilos no funcionarán.

---

## 🔧 Scripts de Diagnóstico Automático

### package.json - Scripts de Troubleshooting
```json
{
  "scripts": {
    "doctor": "node scripts/doctor.js",
    "deps:audit": "npm list --depth=0",
    "deps:outdated": "npm outdated",
    "deps:security": "npm audit --audit-level moderate",
    "docker:logs": "docker-compose logs --tail=50 app",
    "docker:debug": "docker-compose build --no-cache --progress=plain",
    "docker:clean": "docker-compose down -v && docker system prune -f",
    "test:env": "node scripts/test-environment.js",
    "fix:permissions": "sudo chown -R $USER:$USER .",
    "ports:check": "netstat -tulpn | grep -E ':(3000|3001|5432|6379)'",
    "health": "curl -f http://localhost:3001/api/health || echo 'API not responding'"
  }
}
```

### scripts/doctor.js - Diagnóstico Completo
```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('🩺 PriceSync ERP - System Doctor\n');

const checks = [
  {
    name: 'Node.js Version',
    command: 'node --version',
    expected: 'v20.10.0',
    critical: true
  },
  {
    name: 'NPM Version', 
    command: 'npm --version',
    expected: '10.2.0',
    critical: true
  },
  {
    name: 'Docker Version',
    command: 'docker --version',
    expected: '24.0.0',
    critical: true
  },
  {
    name: 'Docker Compose',
    command: 'docker-compose --version',
    expected: '2.21.0',
    critical: true
  },
  {
    name: 'Python (for native deps)',
    command: 'python3 --version',
    expected: '3.8',
    critical: false
  },
  {
    name: 'Git',
    command: 'git --version',
    expected: '2.0',
    critical: false
  }
];

let criticalIssues = 0;
let warnings = 0;

checks.forEach(check => {
  try {
    const result = execSync(check.command, { encoding: 'utf8' }).trim();
    const version = result.match(/\d+\.\d+\.\d+/)?.[0];
    
    if (version && version >= check.expected) {
      console.log(`${GREEN}✅ ${check.name}: ${result}${RESET}`);
    } else {
      const symbol = check.critical ? '❌' : '⚠️';
      const color = check.critical ? RED : YELLOW;
      console.log(`${color}${symbol} ${check.name}: ${result} (Expected: ${check.expected}+)${RESET}`);
      
      if (check.critical) criticalIssues++;
      else warnings++;
    }
  } catch (error) {
    const symbol = check.critical ? '❌' : '⚠️';
    const color = check.critical ? RED : YELLOW;
    console.log(`${color}${symbol} ${check.name}: NOT FOUND${RESET}`);
    
    if (check.critical) criticalIssues++;
    else warnings++;
  }
});

// Check Docker daemon
try {
  execSync('docker ps', { encoding: 'utf8' });
  console.log(`${GREEN}✅ Docker Daemon: Running${RESET}`);
} catch (error) {
  console.log(`${RED}❌ Docker Daemon: Not running${RESET}`);
  criticalIssues++;
}

// Check project files
const criticalFiles = [
  'package.json',
  'docker-compose.yml', 
  'prisma/schema.prisma',
  'src/main/main.ts',
  'src/renderer/src/main.ts'
];

console.log('\n📁 Project Files:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`${GREEN}✅ ${file}${RESET}`);
  } else {
    console.log(`${RED}❌ ${file}${RESET}`);
    criticalIssues++;
  }
});

// Check ports
console.log('\n🔌 Port Check:');
const ports = [3000, 3001, 5432, 6379];
ports.forEach(port => {
  try {
    const result = execSync(`netstat -tulpn | grep :${port}`, { encoding: 'utf8' });
    if (result) {
      console.log(`${YELLOW}⚠️ Port ${port}: IN USE${RESET}`);
      warnings++;
    } else {
      console.log(`${GREEN}✅ Port ${port}: Available${RESET}`);
    }
  } catch (error) {
    console.log(`${GREEN}✅ Port ${port}: Available${RESET}`);
  }
});

// Final summary
console.log('\n📊 Summary:');
if (criticalIssues === 0 && warnings === 0) {
  console.log(`${GREEN}🎉 All systems GO! Ready to develop.${RESET}`);
} else if (criticalIssues === 0) {
  console.log(`${YELLOW}⚠️ ${warnings} warnings, but should work fine.${RESET}`);
} else {
  console.log(`${RED}❌ ${criticalIssues} critical issues must be fixed before proceeding.${RESET}`);
  console.log('\nSee troubleshooting section in TROUBLESHOOTING.md');
  process.exit(1);
}
```

### scripts/test-environment.js - Test Específico Docker
```javascript
#!/usr/bin/env node
const { exec } = require('child_process');

const tests = [
  {
    name: 'Docker Build',
    command: 'docker-compose build app',
    timeout: 120000 // 2 minutes
  },
  {
    name: 'Database Connection',
    command: 'docker-compose up -d db && sleep 5 && docker-compose exec -T db pg_isready',
    timeout: 30000
  },
  {
    name: 'Redis Connection', 
    command: 'docker-compose up -d redis && sleep 3 && docker-compose exec -T redis redis-cli ping',
    timeout: 15000
  },
  {
    name: 'App Start',
    command: 'timeout 30s docker-compose up app || true',
    timeout: 35000
  }
];

console.log('🧪 Testing Docker Environment...\n');

async function runTest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`⏳ Testing: ${test.name}...`);
    
    const process = exec(test.command, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error && !error.killed) {
        console.log(`❌ ${test.name}: FAILED (${duration}ms)`);
        console.log(`   Error: ${error.message}`);
        if (stderr) console.log(`   Stderr: ${stderr}`);
        resolve(false);
      } else {
        console.log(`✅ ${test.name}: PASSED (${duration}ms)`);
        resolve(true);
      }
    });
    
    // Timeout handling
    setTimeout(() => {
      process.kill();
      console.log(`⏰ ${test.name}: TIMEOUT (${test.timeout}ms)`);
      resolve(false);
    }, test.timeout);
  });
}

async function runAllTests() {
  let passed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result) passed++;
    console.log(''); // Empty line
  }
  
  console.log(`📊 Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 Environment is ready for development!');
  } else {
    console.log('❌ Environment has issues. Check logs above.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);
```

---

## 🐛 Errores Comunes y Soluciones

### Error: "gyp ERR! build error"
**Síntomas:** Falla al instalar dependencias nativas
```bash
# Solución 1: Instalar build tools
# En Ubuntu/Debian:
sudo apt-get install python3 make g++

# En Alpine (Docker):
apk add --no-cache python3 make g++

# Solución 2: Usar imagen con build tools
# En Dockerfile, cambiar:
FROM node:20-alpine
# Por:
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev
```

### Error: "EACCES: permission denied"
**Síntomas:** Permisos de archivos o Docker
```bash
# Solución 1: Arreglar ownership
sudo chown -R $USER:$USER .
npm run fix:permissions

# Solución 2: Agregar usuario a grupo docker
sudo usermod -aG docker $USER
# Luego logout/login

# Solución 3: En el container
docker-compose exec app chown -R node:node /app
```

### Error: "Port 3000 is already in use"
**Síntomas:** Puerto ocupado
```bash
# Ver qué está usando el puerto
npm run ports:check
# o
netstat -tulpn | grep :3000

# Matar proceso específico
kill -9 $(lsof -ti:3000)

# Cambiar puerto en docker-compose.yml
services:
  app:
    ports:
      - "3002:3000"  # Usar puerto diferente
```

### Error: "Docker daemon not running"
**Síntomas:** Docker no disponible
```bash
# En Windows: Iniciar Docker Desktop

# En Linux:
sudo systemctl start docker
sudo systemctl enable docker

# Verificar:
docker ps
```

### Error: "Cannot resolve dependency tree"
**Síntomas:** Conflictos de dependencias NPM
```bash
# Solución 1: Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Solución 2: Force install (último recurso)
npm install --force

# Solución 3: Usar versiones específicas (recomendado)
npm install vue@3.4.21 --save-exact
```

### Error: "Prisma generate failed"
**Síntomas:** No puede generar cliente Prisma
```bash
# Verificar schema válido
npx prisma validate

# Regenerar cliente
npx prisma generate

# Reset completo database
npx prisma migrate reset

# En Docker:
docker-compose exec app npx prisma generate
```

### Error: "Electron failed to start"
**Síntomas:** Electron no puede inicializar
```bash
# Verificar display (en Linux sin GUI)
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# Rebuild electron
npm run electron:rebuild

# Verificar arquitectura
npm config set target_arch x64
npm config set target_platform win32
```

---

## 🔍 Logs y Debugging

### Ver Logs Específicos
```bash
# Logs de la aplicación
npm run docker:logs

# Logs específicos por servicio
docker-compose logs app
docker-compose logs db  
docker-compose logs redis

# Logs en tiempo real
docker-compose logs -f app

# Logs con timestamps
docker-compose logs -t app
```

### Debug Mode
```bash
# Modo debug completo
DEBUG=* npm run dev

# Debug específico de módulos
DEBUG=prisma:* npm run dev
DEBUG=electron:* npm run dev

# En Docker con debug
docker-compose -f docker-compose.debug.yml up
```

### Inspeccionar Containers
```bash
# Entrar al container
docker-compose exec app sh
docker-compose exec db psql -U postgres -d pricesync

# Verificar archivos
docker-compose exec app ls -la /app
docker-compose exec app cat /app/package.json

# Verificar procesos
docker-compose exec app ps aux
```

---

## 🚀 Performance y Optimización

### Docker Performance
```bash
# Limpiar cache Docker
docker system prune -a --volumes

# Ver uso de espacio
docker system df

# Optimizar builds
# En docker-compose.yml:
services:
  app:
    build:
      context: .
      target: development
      cache_from:
        - node:20-alpine
```

### NPM Performance
```bash
# Cache NPM optimizado
npm config set cache /tmp/.npm
npm config set prefer-offline true

# Usar CI install
npm ci # En lugar de npm install
```

---

## 📋 Checklist Pre-Commit

Antes de hacer commit, verificar:

```bash
# 1. Tests pasan
npm run test

# 2. Linting OK
npm run lint

# 3. Build exitoso
npm run build

# 4. Docker build OK
docker-compose build

# 5. Health check
npm run health

# 6. No secrets expuestos
git diff --cached | grep -i -E "(password|secret|key|token)" || echo "No secrets found ✅"
```

---

## 🆘 Cuando Todo Falla (Nuclear Option)

```bash
#!/bin/bash
# scripts/nuclear-reset.sh

echo "🚨 NUCLEAR RESET - Borrando EVERYTHING"
echo "Presiona Ctrl+C en 5 segundos para cancelar..."
sleep 5

# Parar todo
docker-compose down -v
docker system prune -af --volumes
docker volume prune -f

# Limpiar Node
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force

# Limpiar archivos temporales
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .vite

# Reinstalar desde cero
npm install

# Rebuild Docker
docker-compose build --no-cache --pull

# Test básico
npm run doctor

echo "🎉 Nuclear reset complete. Try 'npm run dev' now."
```

---

## 📞 Getting Help

### Información para Reportar Issues
```bash
# Generar reporte completo
cat > issue-report.txt << EOF
=== SYSTEM INFO ===
OS: $(uname -a)
Node: $(node --version)
NPM: $(npm --version) 
Docker: $(docker --version)

=== PROJECT STATE ===
$(npm run doctor 2>&1)

=== LAST LOGS ===
$(docker-compose logs --tail=20 app 2>&1)

=== ERROR DETAILS ===
[Paste your specific error here]
EOF

echo "Report generated: issue-report.txt"
echo "Share this file when asking for help"
```

---

## ⚠️ PREVENTION IS BETTER THAN CURE

### Pre-Development Checklist
```bash
# 1. System check
npm run doctor

# 2. Clean environment  
npm run docker:clean

# 3. Fresh install
npm ci

# 4. Environment test
npm run test:env

# 5. Health check
npm run health

# ✅ If all pass, you're ready to code!
```

### Daily Maintenance
```bash
# Morning routine (start of day)
docker-compose down
docker system prune -f
docker-compose up -d

# Evening routine (end of day)  
docker-compose down
npm run deps:audit
```

---

## 🔧 TRAE-Specific Tips

### Prompt Template for Dependency Issues
```
"ANTES de implementar nueva funcionalidad:

1. Verifica que todas las dependencias actuales funcionen
2. Ejecuta 'npm run doctor' y resuelve cualquier issue
3. Si agregas nuevas dependencias, usa versiones EXACTAS
4. Testa la nueva funcionalidad en ambiente limpio
5. Documenta cualquier nueva dependencia en TECH_STACK.md

Solo procede si el environment está 100% estable."
```