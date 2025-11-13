// Script برای import کردن دیتابیس از SQL
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

const dbPath = path.join(process.cwd(), 'database', 'ads.db')
const inputPath = path.join(process.cwd(), 'database', 'export.sql')

if (!fs.existsSync(inputPath)) {
  console.error('❌ فایل export.sql پیدا نشد!')
  process.exit(1)
}

const sql = fs.readFileSync(inputPath, 'utf8')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err)
    process.exit(1)
  }
  console.log('✅ اتصال به دیتابیس برقرار شد')
})

// تقسیم SQL به دستورات جداگانه
const statements = sql.split(';').filter(s => s.trim().length > 0)

let completed = 0
statements.forEach((statement, index) => {
  const trimmed = statement.trim()
  if (trimmed.length === 0) return
  
  db.run(trimmed, (err) => {
    if (err) {
      console.error(`❌ خطا در اجرای دستور ${index + 1}:`, err.message)
      console.error('دستور:', trimmed.substring(0, 100))
    }
    
    completed++
    if (completed === statements.length) {
      console.log('✅ دیتابیس import شد!')
      db.close()
    }
  })
})

