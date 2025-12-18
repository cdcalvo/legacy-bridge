# Cómo Verificar que los Datos se Guardan en Base de Datos

## ✅ Método 1: Usando la Aplicación Web (Recomendado)

### Pasos:

1. **Inicia PostgreSQL** (si no está corriendo):
   ```bash
   # Windows
   pg_ctl -D "C:\Program Files\PostgreSQL\{version}\data" start
   ```

2. **Verifica tu archivo `.env`** en la raíz del proyecto:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/legacy_bridge
   NODE_ENV=development
   ```

3. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

4. **Abre el navegador** en http://localhost:3000

5. **Haz la prueba**:
   - Haz clic en "Load Sample Data"
   - Haz clic en "Ingest Transactions"
   - Deberías ver:
     - ✅ Notificación verde: "Successfully ingested X transactions"
     - ✅ Las transacciones aparecen en la tabla
     - ✅ Los filtros de categorías se actualizan

6. **Revisa la consola del servidor** (terminal donde ejecutaste `npm run dev`):
   ```
   📥 Received ingestion request...
   🔄 Starting ingestion process...
   Attempting to save 3 transactions to database...
   Executed query { text: 'INSERT INTO transactions...', duration: 25, rows: 1 }
   Successfully saved 3 transactions to database
   📊 Ingestion result: {
     success: true,
     totalProcessed: 3,
     totalSaved: 3,
     errors: 0
   }
   ```

---

## 🔍 Método 2: Script de Verificación

### Ejecuta el script de verificación:

```bash
node scripts/check-database.js
```

### Salida esperada si TODO está bien:

```
🔍 Checking database connection...

✅ Database connected successfully

📋 Tables in database:
   - merchants
   - transactions

👥 Merchants: 3
   First 5 merchants:
   - [1] AMZN
   - [2] Starbucks
   - [3] PAYPAL

💳 Transactions: 3
   Last 5 transactions:
   - [tx_003] PAYPAL *EBAY - EUR 1200.00 (Shopping)
   - [tx_002] Starbucks Store 2291 - USD 5.50 (Dining)
   - [tx_001] AMZN Mktp US - USD 120.50 (Shopping)

📊 Category Summary:
   - Shopping: 2 transactions, Total: 1320.50
   - Dining: 1 transactions, Total: 5.50

✅ Database check complete!
```

### Si hay problemas:

```
❌ Error checking database: connect ECONNREFUSED 127.0.0.1:5432

💡 Make sure PostgreSQL is running on localhost:5432
```

---

## 🗄️ Método 3: Consultar PostgreSQL Directamente

### Usando psql (línea de comandos):

```bash
# Conectarse a la base de datos
psql -U postgres -d legacy_bridge

# Ver todas las transacciones
SELECT * FROM transactions;

# Ver todos los merchants
SELECT * FROM merchants;

# Ver resumen por categoría
SELECT category, COUNT(*), SUM(amount)
FROM transactions
GROUP BY category;

# Salir
\q
```

### Usando pgAdmin (GUI):

1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL
3. Navega a: Servers → PostgreSQL → Databases → legacy_bridge → Schemas → public → Tables
4. Haz clic derecho en "transactions" → View/Edit Data → All Rows

---

## 🐛 Troubleshooting

### Problema: "Database connection error"

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows
   services.msc  # Busca "PostgreSQL"
   ```

2. Verifica el `DATABASE_URL` en `.env`

3. Intenta conectar manualmente:
   ```bash
   psql -U postgres -d legacy_bridge
   ```

### Problema: "Tables do not exist"

**Solución:**
1. Llama al endpoint de setup:
   ```bash
   # Usando curl
   curl -X POST http://localhost:3000/api/setup

   # O desde el navegador
   http://localhost:3000/api/setup
   ```

### Problema: "Successfully ingested 0 transactions"

**Posibles causas:**
1. **Error de parsing XML** - Revisa la consola para errores
2. **Error al crear merchants** - Verifica que la tabla merchants exista
3. **Error en la transacción de base de datos** - Revisa logs de PostgreSQL

**Solución:**
- Revisa la consola del servidor para ver errores específicos
- Los errores ahora se muestran con emojis para facilitar la identificación:
  - 📥 = Recibiendo request
  - 🔄 = Procesando
  - ✅ = Éxito
  - ❌ = Error

---

## 📝 Datos de Prueba

El botón "Load Sample Data" carga este XML:

```xml
<transactions>
  <transaction>
    <txn_id>tx_001</txn_id>
    <description>AMZN Mktp US*123</description>
    <amount>120.50</amount>
    <currency>USD</currency>
    <date>2023/10/01</date>
  </transaction>
  <transaction>
    <txn_id>tx_002</txn_id>
    <description>Starbucks Store 2291</description>
    <amount>$5.50</amount>
    <currency>USD</currency>
    <date>Oct 02, 2023</date>
  </transaction>
  <transaction>
    <txn_id>tx_003</txn_id>
    <description>PAYPAL *EBAY</description>
    <amount>1200.00</amount>
    <currency>EUR</currency>
    <date>2023-10-03</date>
  </transaction>
</transactions>
```

Estos datos deberían crear:
- 3 merchants: AMZN, Starbucks, PAYPAL
- 3 transacciones categorizadas automáticamente
