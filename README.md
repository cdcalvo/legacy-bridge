# Legacy Bridge - Integración Middleware

Una solución middleware moderna para integrar datos de transacciones XML de sistemas legacy hacia una base de datos PostgreSQL estructurada con categorización inteligente.

**Autor:** Christian David Calvo
**Reto:** Solutions Engineer Take-Home Challenge

---

## 📋 Tabla de Contenidos

1. [Cómo Ejecutar el Proyecto Localmente](#-cómo-ejecutar-el-proyecto-localmente)
2. [Explicación del Esquema de Base de Datos](#-explicación-del-esquema-de-base-de-datos)
3. [Estrategia de Manejo de Errores](#-estrategia-de-manejo-de-errores)
4. [Instrucciones de Docker](#-instrucciones-de-docker)
5. [Descripción de la Arquitectura](#-descripción-de-la-arquitectura)
6. [Configuración del Motor de Reglas](#-configuración-del-motor-de-reglas)
7. [Referencia de API](#-referencia-de-api)

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### Prerrequisitos

- **Node.js** 20 o superior
- **PostgreSQL** 16 o superior
- **npm** (viene incluido con Node.js)

### Instrucciones Paso a Paso

#### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/TU_USUARIO/legacy-bridge.git
cd legacy-bridge
```

#### Paso 2: Instalar Dependencias

```bash
npm install
```

#### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

Edita el archivo `.env` con tu cadena de conexión de PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/legacy_bridge
NODE_ENV=development
```

#### Paso 4: Configurar la Base de Datos PostgreSQL

**Opción A: Usando Docker (Recomendado)**

```bash
# Iniciar contenedor de PostgreSQL
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine

# Crear la base de datos
docker exec -it postgres psql -U postgres -c "CREATE DATABASE legacy_bridge;"
```

**Opción B: Usando una instalación existente de PostgreSQL**

```bash
# Conectar a PostgreSQL y crear la base de datos
psql -U postgres -c "CREATE DATABASE legacy_bridge;"
```

#### Paso 5: Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

#### Paso 6: Abrir la Aplicación

Navega a [http://localhost:3000](http://localhost:3000) en tu navegador.

El esquema de la base de datos se creará automáticamente cuando cargues la aplicación por primera vez (a través del endpoint `/api/setup`).

---

## 📊 Explicación del Esquema de Base de Datos

### Justificación del Diseño

La base de datos sigue la normalización de **Tercera Forma Normal (3NF)** con dos entidades principales: `merchants` (comerciantes) y `transactions` (transacciones).

### Diagrama Entidad-Relación

```
┌─────────────────────────┐       ┌─────────────────────────────────┐
│       merchants         │       │         transactions            │
│      (comerciantes)     │       │        (transacciones)          │
├─────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, SERIAL)         │       │ id (PK, SERIAL)                 │
│ name (VARCHAR)          │       │ txn_id (VARCHAR, UNIQUE)        │
│ normalized_name (UNIQUE)│◄──────│ merchant_id (FK)                │
│ created_at (TIMESTAMP)  │       │ description (VARCHAR)           │
│ updated_at (TIMESTAMP)  │       │ raw_description (VARCHAR)       │
└─────────────────────────┘       │ amount (DECIMAL 15,2)           │
                                  │ currency (VARCHAR 3)            │
                                  │ date (DATE)                     │
                                  │ category (VARCHAR)              │
                                  │ created_at (TIMESTAMP)          │
                                  │ updated_at (TIMESTAMP)          │
                                  └─────────────────────────────────┘
```

### ¿Por Qué Este Diseño?

#### 1. Normalización (Tabla Separada de Comerciantes)

**Problema:** Sin normalización, los datos del comerciante se duplicarían:
```
| txn_id | merchant_name    | amount |
|--------|------------------|--------|
| tx_001 | Starbucks Store  | 5.50   |
| tx_002 | Starbucks Store  | 4.25   |  ← ¡Duplicado!
| tx_003 | Starbucks Store  | 6.00   |  ← ¡Duplicado!
```

**Solución:** Normalizar en tablas separadas:
```
merchants:                    transactions:
| id | name      |            | txn_id | merchant_id | amount |
|----|-----------|            |--------|-------------|--------|
| 1  | Starbucks |  ◄─────────| tx_001 | 1           | 5.50   |
                              | tx_002 | 1           | 4.25   |
                              | tx_003 | 1           | 6.00   |
```

**Beneficios:**
- Reduce los requisitos de almacenamiento
- Permite análisis a nivel de comerciante (total gastado por comerciante)
- Un solo punto de actualización si cambia el nombre del comerciante

#### 2. Tipos de Datos

| Columna | Tipo | Razón |
|---------|------|-------|
| `amount` | `DECIMAL(15,2)` | Evita errores de precisión de punto flotante (ej: 0.1 + 0.2 ≠ 0.3 en float) |
| `currency` | `VARCHAR(3)` | Sigue el estándar ISO 4217 (USD, EUR, COP) |
| `date` | `DATE` | Solo necesitamos precisión de fecha, no de hora |
| `id` | `SERIAL` | Entero auto-incremental, eficiente para indexación |

#### 3. Índices

```sql
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
```

**¿Por qué estos índices?**
- `category`: Filtrado rápido para los botones de categoría del dashboard
- `date`: Consultas eficientes por rango de fechas para reportes
- `merchant_id`: Joins rápidos con la tabla de comerciantes

#### 4. Restricciones (Constraints)

| Restricción | Propósito |
|-------------|-----------|
| `UNIQUE(txn_id)` | Previene importaciones duplicadas de transacciones |
| `UNIQUE(normalized_name)` | Previene comerciantes duplicados |
| `FOREIGN KEY(merchant_id)` | Mantiene la integridad referencial |

### Script DDL Completo

Ver [`sql/schema.sql`](./sql/schema.sql) para el script completo de creación de la base de datos.

---

## 🛡️ Estrategia de Manejo de Errores

### Cómo el Sistema Maneja Datos Incorrectos del API Legacy

El pipeline de ingesta implementa una **estrategia de manejo de errores en múltiples niveles**:

#### Nivel 1: Errores de Parseo XML

```typescript
// src/infrastructure/parsers/XMLTransactionParser.ts

async parse(xmlString: string): Promise<Transaction[]> {
  try {
    const result = await parseStringPromise(xmlString);
    // Procesar transacciones...
  } catch (error) {
    throw new Error(`Error al parsear XML: ${error.message}`);
  }
}
```

**Comportamiento:** Si el XML está mal formado, toda la ingesta falla con un mensaje de error descriptivo.

#### Nivel 2: Errores de Transacciones Individuales

```typescript
// src/application/use-cases/IngestTransactionsUseCase.ts

for (const transaction of parsedTransactions) {
  try {
    // Procesar transacción...
    processedTransactions.push(transaction);
  } catch (error) {
    // Registra el error pero continúa procesando otras transacciones
    errors.push(`Error procesando ${transaction.txnId}: ${error.message}`);
  }
}
```

**Comportamiento:** Si una transacción falla (ej: monto inválido), se registra pero las otras transacciones continúan procesándose. Esto se llama **éxito parcial**.

#### Nivel 3: Errores de Validación de Datos

| Problema en los Datos | Cómo se Maneja |
|----------------------|----------------|
| Monto con símbolo de moneda (`$5.50`) | Se elimina automáticamente: `$5.50` → `5.50` |
| Monto con comas (`1,200.00`) | Se elimina automáticamente: `1,200.00` → `1200.00` |
| Monto no numérico (`abc`) | Se lanza error con mensaje descriptivo |
| Diferentes formatos de fecha | Se parsean usando múltiples patrones de formato |
| Fecha inválida | Se lanza error con mensaje descriptivo |

#### Nivel 4: Errores de Base de Datos

```typescript
// UPSERT maneja duplicados elegantemente
INSERT INTO transactions (...) 
VALUES (...) 
ON CONFLICT (txn_id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP
```

**Comportamiento:** Si una transacción con el mismo `txn_id` ya existe, se actualiza en lugar de causar un error de clave duplicada.

### Implementación del Registro de Errores

#### Implementación Actual (Desarrollo)

```typescript
// Los errores se recolectan y se devuelven en la respuesta del API
return {
  success: errors.length === 0,
  totalProcessed: parsedTransactions.length,
  totalSaved: savedTransactions.length,
  errors: errors,  // Array de mensajes de error
  transactions: savedTransactions,
};
```

#### Recomendaciones para Producción

Para un ambiente de producción, implementaría:

1. **Logging Estructurado con Winston o Pino**
   ```typescript
   logger.error('Procesamiento de transacción falló', {
     txnId: transaction.txnId,
     error: error.message,
     stack: error.stack,
     timestamp: new Date().toISOString(),
     correlationId: requestId,
   });
   ```

2. **Servicio de Agregación de Errores (Sentry/DataDog)**
   - Monitoreo de errores en tiempo real
   - Agrupación y deduplicación de errores
   - Alertas para errores críticos

3. **Cola de Mensajes Fallidos (Dead Letter Queue - DLQ)**
   - Las transacciones fallidas se envían a una cola
   - Pueden reprocesarse después de corregir el problema
   - No hay pérdida de datos incluso en fallos

4. **Mecanismo de Reintentos con Backoff Exponencial**
   ```typescript
   // Para errores transitorios (red, timeout de base de datos)
   async function withRetry(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
       }
     }
   }
   ```

5. **Endpoint de Health Check**
   ```typescript
   // GET /api/health
   // Retorna: { status: 'healthy', database: 'connected', timestamp: '...' }
   ```

---

## 🐳 Instrucciones de Docker

### Opción 1: Docker Compose (Recomendado)

Esto inicia tanto la aplicación como la base de datos PostgreSQL:

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Opción 2: Construir Solo la Imagen Docker

Si tienes PostgreSQL ejecutándose en otro lugar:

```bash
# Construir la imagen
docker build -t legacy-bridge .

# Ejecutar el contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  legacy-bridge
```

### Configuración de Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: legacy_bridge
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/legacy_bridge
    depends_on:
      db:
        condition: service_healthy
```

---

## 🏗️ Descripción de la Arquitectura

Este proyecto sigue los principios de **Clean Architecture** (Arquitectura Limpia):

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                         │
│  src/presentation/components/    Componentes UI React           │
│  src/app/page.tsx                Dashboard Principal            │
│  src/app/api/                    Rutas API de Next.js           │
├─────────────────────────────────────────────────────────────────┤
│                    CAPA DE APLICACIÓN                           │
│  src/application/use-cases/     Operaciones de Negocio          │
│  src/application/dtos/          Objetos de Transferencia        │
├─────────────────────────────────────────────────────────────────┤
│                      CAPA DE DOMINIO                            │
│  src/domain/entities/           Entidades de Negocio            │
│  src/domain/interfaces/         Contratos de Repositorios       │
│  src/domain/rules/              Motor de Reglas                 │
├─────────────────────────────────────────────────────────────────┤
│                   CAPA DE INFRAESTRUCTURA                       │
│  src/infrastructure/database/   Implementación PostgreSQL       │
│  src/infrastructure/parsers/    Parser XML                      │
└─────────────────────────────────────────────────────────────────┘
```

### Patrones de Diseño Utilizados

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| **Repository Pattern** | `src/domain/interfaces/` | Abstrae la persistencia de datos |
| **Strategy Pattern** | `src/domain/rules/` | Reglas de categorización extensibles |
| **Use Case Pattern** | `src/application/use-cases/` | Operaciones de negocio de propósito único |
| **Factory Pattern** | `src/domain/entities/` | Crea objetos de dominio válidos |
| **Singleton Pattern** | Instancias de repositorios | Instancias compartidas en la app |

---

## 🔧 Configuración del Motor de Reglas

El motor de categorización está diseñado para ser **extensible sin cambios en el código**.

### Reglas Actuales

```typescript
// src/domain/rules/categoryRules.config.ts

export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'eCommerce',
    keywords: ['AMZN', 'AMAZON', 'EBAY', 'PAYPAL', 'ETSY'],
    priority: 10,
  },
  {
    category: 'Transport & Food',
    keywords: ['STARBUCKS', 'UBER', 'LYFT', 'DOORDASH'],
    priority: 10,
  },
  {
    category: 'Entertainment',
    keywords: ['NETFLIX', 'SPOTIFY', 'HULU', 'DISNEY'],
    priority: 5,
  },
];
```

### Agregar Nuevas Reglas

Para agregar una nueva categoría, simplemente agrega un objeto al array:

```typescript
{
  category: 'Suministros de Oficina',
  keywords: ['STAPLES', 'OFFICE DEPOT', 'PAPELERIA'],
  priority: 5,
}
```

**No se requieren cambios en el código** - solo configuración.

---

## 🧪 Referencia de API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/setup` | Inicializa el esquema de la base de datos |
| `POST` | `/api/ingest` | Ingesta datos de transacciones XML |
| `GET` | `/api/transactions` | Obtiene todas las transacciones |
| `GET` | `/api/transactions?category=X` | Filtra por categoría |
| `GET` | `/api/categories` | Obtiene categorías con estadísticas |

### Ejemplo: Ingestar Transacciones

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<transactions><transaction><txn_id>tx_001</txn_id><description>AMZN Mktp US*123</description><amount>120.50</amount><currency>USD</currency><date>2023/10/01</date></transaction></transactions>"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 1,
    "totalSaved": 1,
    "errors": [],
    "transactions": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📝 Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL 16
- **Estilos:** Tailwind CSS
- **Parseo XML:** xml2js
- **Contenedorización:** Docker + Docker Compose

---


##
 🎬 Video Walkthroughs

### Video A: Demostración del Producto (Cliente)

Presentación orientada al negocio mostrando cómo la herramienta ayuda a visualizar y categorizar los gastos corporativos.
🔗 
**[Ver Video - Demostración del Producto](https://www.loom.com/share/cbcc5c0b77ef4dfdba1a17f280c64175)**

**Contenido:**

- Introducción al dashboard
- Demostración de ingesta de datos XML
- Visualización de transacciones categorizadas
- Uso de filtros por categoría
- Estadísticas en tiempo real
---

### Video B: Recorrido Técnico (Ingeniería)

Presentación técnica detallando la arquitectura, patrones de diseño y decisiones de implementación.
🔗 
** [Ver Video - Recorrido Técnico](https://www.loom.com/share/783e057d8a0e4b04b4493d6db324a9bd)**

**Contenido:**

- Arquitectura Clean Architecture
- Parser XML y sanitización de datos
- Motor de reglas extensible (Strategy Pattern)
- Esquema de base de datos normalizado
- Manejo de errores y flujo de ingesta
---