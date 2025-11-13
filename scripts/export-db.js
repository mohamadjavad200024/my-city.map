// Script برای export کردن دیتابیس به SQL
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

const dbPath = path.join(process.cwd(), 'database', 'ads.db')
const outputPath = path.join(process.cwd(), 'database', 'export.sql')

if (!fs.existsSync(dbPath)) {
  console.error('❌ فایل دیتابیس پیدا نشد!')
  process.exit(1)
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err)
    process.exit(1)
  }
  console.log('✅ اتصال به دیتابیس برقرار شد')
})

let sqlOutput = ''

// Export کردن schema
db.serialize(() => {
  db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('❌ خطا در خواندن schema:', err)
      return
    }
    
    rows.forEach(row => {
      if (row.sql) {
        sqlOutput += row.sql + ';\n\n'
      }
    })
    
    // Export کردن داده‌ها
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ خطا در خواندن جداول:', err)
        return
      }
      
      let completed = 0
      tables.forEach(table => {
        const tableName = table.name
        if (tableName === 'sqlite_sequence') return
        
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
          if (err) {
            console.error(`❌ خطا در خواندن جدول ${tableName}:`, err)
            return
          }
          
          if (rows.length > 0) {
            sqlOutput += `-- Data for table ${tableName}\n`
            rows.forEach(row => {
              const columns = Object.keys(row).join(', ')
              const values = Object.values(row).map(v => {
                if (v === null) return 'NULL'
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
                return v
              }).join(', ')
              sqlOutput += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`
            })
            sqlOutput += '\n'
          }
          
          completed++
          if (completed === tables.length) {
            fs.writeFileSync(outputPath, sqlOutput)
            console.log(`✅ دیتابیس export شد به: ${outputPath}`)
            db.close()
          }
        })
      })
    })
  })
})

