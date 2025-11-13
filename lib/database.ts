import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

// مسیر فایل دیتابیس
const dbPath = path.join(process.cwd(), 'database', 'ads.db')

// اطمینان از وجود پوشه database
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// ایجاد اتصال به دیتابیس
let db: sqlite3.Database | null = null
let tableInitializationPromise: Promise<void> | null = null

async function initializeTable(db: sqlite3.Database): Promise<void> {
  if (tableInitializationPromise) {
    return tableInitializationPromise
  }
  
  tableInitializationPromise = new Promise((resolve, reject) => {
    // ایجاد جدول ads
    db.run(`
      CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        phone TEXT NOT NULL,
        password TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err: Error | null) => {
      if (err) {
        tableInitializationPromise = null
        reject(err)
        return
      }
      
      // ایجاد جدول products
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          price REAL NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL,
          images TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err: Error | null) => {
        if (err) {
          tableInitializationPromise = null
          reject(err)
          return
        }
        
        // اضافه کردن فیلدهای lat و lng اگر وجود نداشته باشند (migration)
        db.all(`PRAGMA table_info(products)`, (err: Error | null, columns: any[]) => {
          if (err) {
            tableInitializationPromise = null
            reject(err)
            return
          }
          
          const hasLat = columns.some((col: any) => col.name === 'lat')
          const hasLng = columns.some((col: any) => col.name === 'lng')
          
          const migrations: Promise<void>[] = []
          
          if (!hasLat) {
            migrations.push(new Promise<void>((resolve, reject) => {
              db.run(`ALTER TABLE products ADD COLUMN lat REAL`, (err: Error | null) => {
                if (err) reject(err)
                else resolve()
              })
            }))
          }
          
          if (!hasLng) {
            migrations.push(new Promise<void>((resolve, reject) => {
              db.run(`ALTER TABLE products ADD COLUMN lng REAL`, (err: Error | null) => {
                if (err) reject(err)
                else resolve()
              })
            }))
          }
          
          // بررسی و اضافه کردن فیلد is_store به جدول ads
          db.all(`PRAGMA table_info(ads)`, (err: Error | null, adsColumns: any[]) => {
            if (err) {
              tableInitializationPromise = null
              reject(err)
              return
            }
            
            const hasIsStore = adsColumns.some((col: any) => col.name === 'is_store')
            const hasStoreName = adsColumns.some((col: any) => col.name === 'store_name')
            const hasStoreDescription = adsColumns.some((col: any) => col.name === 'store_description')
            const hasWorkingHoursSatWed = adsColumns.some((col: any) => col.name === 'working_hours_sat_wed')
            const hasWorkingHoursThu = adsColumns.some((col: any) => col.name === 'working_hours_thu')
            const hasInstagramUrl = adsColumns.some((col: any) => col.name === 'instagram_url')
            const hasTelegramUrl = adsColumns.some((col: any) => col.name === 'telegram_url')
            const hasWhatsappUrl = adsColumns.some((col: any) => col.name === 'whatsapp_url')
            const hasProfileImage = adsColumns.some((col: any) => col.name === 'profile_image')
            const hasStorePosterImage = adsColumns.some((col: any) => col.name === 'store_poster_image')
            
            if (!hasIsStore) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN is_store INTEGER DEFAULT 0`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasStoreName) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN store_name TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasStoreDescription) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN store_description TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasWorkingHoursSatWed) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN working_hours_sat_wed TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasWorkingHoursThu) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN working_hours_thu TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasInstagramUrl) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN instagram_url TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasTelegramUrl) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN telegram_url TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasWhatsappUrl) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN whatsapp_url TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasProfileImage) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN profile_image TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            if (!hasStorePosterImage) {
              migrations.push(new Promise<void>((resolve, reject) => {
                db.run(`ALTER TABLE ads ADD COLUMN store_poster_image TEXT`, (err: Error | null) => {
                  if (err) reject(err)
                  else resolve()
                })
              }))
            }
            
            // تابع برای ایجاد جداول چت
            const createChatTables = () => {
              // ایجاد جدول conversations برای گفتگوها
              db.run(`
                CREATE TABLE IF NOT EXISTS conversations (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user1_id INTEGER NOT NULL,
                  user2_id INTEGER NOT NULL,
                  last_message_at DATETIME,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(user1_id, user2_id),
                  FOREIGN KEY(user1_id) REFERENCES ads(id),
                  FOREIGN KEY(user2_id) REFERENCES ads(id)
                )
              `, (err: Error | null) => {
                if (err) {
                  tableInitializationPromise = null
                  reject(err)
                  return
                }
                
                // ایجاد جدول messages برای پیام‌ها
                db.run(`
                  CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    sender_id INTEGER NOT NULL,
                    receiver_id INTEGER NOT NULL,
                    text TEXT NOT NULL,
                    status TEXT DEFAULT 'sent',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id),
                    FOREIGN KEY(sender_id) REFERENCES ads(id),
                    FOREIGN KEY(receiver_id) REFERENCES ads(id)
                  )
                `, (err: Error | null) => {
                  if (err) {
                    tableInitializationPromise = null
                    reject(err)
                    return
                  }
                  
                  // ایجاد ایندکس برای بهبود کارایی
                  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id)`, () => {})
                  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id)`, () => {})
                  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`, () => {})
                  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`, () => {})
                  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`, () => {})
                  
                  // ایجاد جدول followers برای دنبال‌کننده‌ها
                  db.run(`
                    CREATE TABLE IF NOT EXISTS followers (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      follower_id INTEGER NOT NULL,
                      following_id INTEGER NOT NULL,
                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE(follower_id, following_id),
                      FOREIGN KEY(follower_id) REFERENCES ads(id),
                      FOREIGN KEY(following_id) REFERENCES ads(id)
                    )
                  `, (err: Error | null) => {
                    if (err) {
                      tableInitializationPromise = null
                      reject(err)
                      return
                    }
                    
                    // ایجاد ایندکس برای followers
                    db.run(`CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id)`, () => {})
                    db.run(`CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id)`, () => {})
                    
                    // ایجاد جدول saved_items برای محتوای ذخیره شده
                    db.run(`
                      CREATE TABLE IF NOT EXISTS saved_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        item_type TEXT NOT NULL,
                        item_id INTEGER NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, item_type, item_id),
                        FOREIGN KEY(user_id) REFERENCES ads(id)
                      )
                    `, (err: Error | null) => {
                      if (err) {
                        tableInitializationPromise = null
                        reject(err)
                        return
                      }
                      
                      // ایجاد ایندکس برای saved_items
                      db.run(`CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id)`, () => {})
                      db.run(`CREATE INDEX IF NOT EXISTS idx_saved_items_type_id ON saved_items(item_type, item_id)`, () => {})
                      
                      // ایجاد جدول ratings برای امتیازدهی
                      db.run(`
                        CREATE TABLE IF NOT EXISTS ratings (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          rated_user_id INTEGER NOT NULL,
                          rater_user_id INTEGER NOT NULL,
                          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          UNIQUE(rated_user_id, rater_user_id),
                          FOREIGN KEY(rated_user_id) REFERENCES ads(id),
                          FOREIGN KEY(rater_user_id) REFERENCES ads(id)
                        )
                      `, (err: Error | null) => {
                        if (err) {
                          tableInitializationPromise = null
                          reject(err)
                          return
                        }
                        
                        // ایجاد ایندکس برای ratings
                        db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id)`, () => {})
                        db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_rater_user ON ratings(rater_user_id)`, () => {})
                        
                        resolve()
                      })
                    })
                  })
                })
              })
            }
          
            // اگر migrations وجود داشت، ابتدا آنها را اجرا کن، سپس جداول چت را ایجاد کن
            if (migrations.length > 0) {
              Promise.all(migrations).then(() => {
                createChatTables()
              }).catch((err) => {
                tableInitializationPromise = null
                reject(err)
              })
            } else {
              createChatTables()
            }
          })
        })
      })
    })
  })
  
  return tableInitializationPromise
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: Error | null) => {
      if (err) {
        console.error('خطا در اتصال به دیتابیس:', err)
      } else {
        console.log('اتصال به دیتابیس برقرار شد')
      }
    })
  }
  
  return db
}

// بستن اتصال
export function closeDatabase() {
  if (db) {
    db.close((err: Error | null) => {
      if (err) {
        console.error('خطا در بستن دیتابیس:', err)
      } else {
        console.log('اتصال به دیتابیس بسته شد')
      }
    })
    db = null
  }
}

// تبدیل به Promise برای استفاده آسان‌تر
const promisifyDb = (db: sqlite3.Database) => ({
  get: promisify(db.get.bind(db)) as (sql: string, ...params: any[]) => Promise<any>,
  all: promisify(db.all.bind(db)) as (sql: string, ...params: any[]) => Promise<any[]>,
  run: (sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }> => {
    return new Promise((resolve, reject) => {
      db.run(sql, ...params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          })
        }
      })
    })
  }
})

// اضافه کردن آگهی جدید
export async function insertAd(adData: {
  username: string
  phone: string
  password: string
  lat: number
  lng: number
}) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const result = await db.run(
    `INSERT INTO ads (username, phone, password, lat, lng)
     VALUES (?, ?, ?, ?, ?)`,
    adData.username,
    adData.phone,
    adData.password,
    adData.lat,
    adData.lng
  )
  
  return {
    id: result.lastID,
    success: true
  }
}

// دریافت تمام آگهی‌ها
export async function getAllAds() {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.all('SELECT * FROM ads ORDER BY created_at DESC')
}

// دریافت آگهی بر اساس ID
export async function getAdById(id: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.get('SELECT * FROM ads WHERE id = ?', id)
}

// پیدا کردن کاربر با username یا phone
export async function findUserByPhoneOrUsername(phone: string, username: string) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  if (phone && username) {
    return await db.get('SELECT * FROM ads WHERE phone = ? OR username = ?', phone, username)
  } else if (phone) {
    return await db.get('SELECT * FROM ads WHERE phone = ?', phone)
  } else if (username) {
    return await db.get('SELECT * FROM ads WHERE username = ?', username)
  }
  return null
}

// پیدا کردن کاربر با username
export async function findUserByUsername(username: string) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.get('SELECT * FROM ads WHERE username = ?', username)
}

// پیدا کردن کاربر با phone و password (برای لاگین)
export async function findUserByCredentials(phone: string, password: string) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.get('SELECT * FROM ads WHERE phone = ? AND password = ?', phone, password)
}

// پیدا کردن کاربر با phone (برای چک کردن تکراری بودن شماره تماس)
export async function findUserByPhone(phone: string) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.get('SELECT * FROM ads WHERE phone = ?', phone)
}

// به‌روزرسانی اطلاعات کاربر
export async function updateAd(id: number, adData: {
  username?: string
  phone?: string
  password?: string
  lat?: number
  lng?: number
  is_store?: boolean
  store_name?: string
  store_description?: string
  working_hours_sat_wed?: string
  working_hours_thu?: string
  instagram_url?: string
  telegram_url?: string
  whatsapp_url?: string
  profile_image?: string
  store_poster_image?: string
}) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const updates: string[] = []
  const values: any[] = []
  
  if (adData.username !== undefined) {
    updates.push('username = ?')
    values.push(adData.username)
  }
  if (adData.phone !== undefined) {
    updates.push('phone = ?')
    values.push(adData.phone)
  }
  if (adData.password !== undefined) {
    updates.push('password = ?')
    values.push(adData.password)
  }
  if (adData.lat !== undefined) {
    updates.push('lat = ?')
    values.push(adData.lat)
  }
  if (adData.lng !== undefined) {
    updates.push('lng = ?')
    values.push(adData.lng)
  }
  if (adData.is_store !== undefined) {
    updates.push('is_store = ?')
    values.push(adData.is_store ? 1 : 0)
  }
  if (adData.store_name !== undefined) {
    updates.push('store_name = ?')
    values.push(adData.store_name)
  }
  if (adData.store_description !== undefined) {
    updates.push('store_description = ?')
    values.push(adData.store_description)
  }
  if (adData.working_hours_sat_wed !== undefined) {
    updates.push('working_hours_sat_wed = ?')
    values.push(adData.working_hours_sat_wed)
  }
  if (adData.working_hours_thu !== undefined) {
    updates.push('working_hours_thu = ?')
    values.push(adData.working_hours_thu)
  }
  if (adData.instagram_url !== undefined) {
    updates.push('instagram_url = ?')
    values.push(adData.instagram_url || null)
  }
  if (adData.telegram_url !== undefined) {
    updates.push('telegram_url = ?')
    values.push(adData.telegram_url || null)
  }
  if (adData.whatsapp_url !== undefined) {
    updates.push('whatsapp_url = ?')
    values.push(adData.whatsapp_url || null)
  }
  if (adData.profile_image !== undefined) {
    updates.push('profile_image = ?')
    values.push(adData.profile_image || null)
  }
  if (adData.store_poster_image !== undefined) {
    updates.push('store_poster_image = ?')
    values.push(adData.store_poster_image || null)
  }
  
  if (updates.length === 0) {
    console.error('updateAd: هیچ فیلدی برای به‌روزرسانی مشخص نشده است')
    return { success: false, error: 'هیچ فیلدی برای به‌روزرسانی مشخص نشده است' }
  }
  
  values.push(id)
  
  const sql = `UPDATE ads 
     SET ${updates.join(', ')}
     WHERE id = ?`
  
  console.log('updateAd SQL:', sql)
  console.log('updateAd values:', values)
  console.log('updateAd id:', id)
  
  try {
    const result = await db.run(sql, ...values)
    
    console.log('updateAd result:', result)
    console.log('updateAd changes:', result.changes)
    console.log('updateAd lastID:', result.lastID)
    
    // بررسی اینکه آیا رکورد به‌روزرسانی شد یا نه
    if (result.changes === 0) {
      // بررسی اینکه آیا رکورد وجود دارد
      const existing = await db.get('SELECT * FROM ads WHERE id = ?', id)
      console.log('Existing record:', existing)
      
      if (!existing) {
        return { success: false, error: 'رکورد با این ID یافت نشد', changes: 0 }
      }
    }
    
    return {
      success: result.changes > 0,
      changes: result.changes,
      error: result.changes === 0 ? 'هیچ تغییری ایجاد نشد' : undefined
    }
  } catch (error: any) {
    console.error('updateAd error:', error)
    return { success: false, error: error.message || 'خطا در به‌روزرسانی', changes: 0 }
  }
}

// بررسی یکتایی نام فروشگاه
export async function isStoreNameUnique(storeName: string, excludeUserId?: number): Promise<boolean> {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    // چک کردن که آیا نام فروشگاه خالی نیست
    if (!storeName || !storeName.trim()) {
      return true // نام خالی یکتا محسوب می‌شود (برای فروشگاه‌های غیرفعال)
    }
    
    const trimmedStoreName = storeName.trim()
    
    // چک کردن یکتایی
    // استفاده از TRIM برای حذف فاصله‌های اضافی
    // برای فارسی، case-sensitive comparison کافی است (فارسی حروف بزرگ/کوچک ندارد)
    let query = `
      SELECT COUNT(*) as count 
      FROM ads 
      WHERE TRIM(store_name) = ? 
        AND store_name IS NOT NULL 
        AND store_name != ''
        AND is_store = 1
    `
    let params: any[] = [trimmedStoreName]
    
    // اگر excludeUserId مشخص شده باشد، آن را از چک حذف کن
    if (excludeUserId !== undefined) {
      query += ' AND id != ?'
      params.push(excludeUserId)
    }
    
    const result = await db.get(query, ...params)
    const count = result?.count || 0
    
    return count === 0
  } catch (error: any) {
    console.error('isStoreNameUnique error:', error)
    // در صورت خطا، برای امنیت false برمی‌گردانیم تا اجازه ثبت ندهد
    return false
  }
}

// اضافه کردن محصول جدید
export async function insertProduct(productData: {
  userId: number
  title: string
  price: number
  description: string
  status: string
  images: string // JSON string array
  lat?: number
  lng?: number
}) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  // اگر lat و lng داده نشده، از جدول ads بگیر
  let lat = productData.lat
  let lng = productData.lng
  
  if (!lat || !lng) {
    const user = await db.get('SELECT lat, lng FROM ads WHERE id = ?', productData.userId)
    if (user) {
      lat = user.lat
      lng = user.lng
    }
  }
  
  const result = await db.run(
    `INSERT INTO products (user_id, title, price, description, status, images, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    productData.userId,
    productData.title,
    productData.price,
    productData.description,
    productData.status,
    productData.images,
    lat || null,
    lng || null
  )
  
  return {
    id: result.lastID,
    success: true
  }
}

// دریافت تمام محصولات یک کاربر
export async function getProductsByUserId(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.all('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', userId)
}

// دریافت تمام محصولات
export async function getAllProducts() {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  // JOIN با جدول ads برای دریافت اطلاعات is_store
  const products = await db.all(`
    SELECT p.*, a.is_store, a.store_name, a.store_description, a.working_hours_sat_wed, 
           a.working_hours_thu, a.instagram_url, a.telegram_url, a.whatsapp_url, 
           a.profile_image, a.store_poster_image
    FROM products p
    LEFT JOIN ads a ON p.user_id = a.id
    ORDER BY p.created_at DESC
  `)
  return products
}

// دریافت محصول بر اساس ID
export async function getProductById(id: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  return await db.get('SELECT * FROM products WHERE id = ?', id)
}

// به‌روزرسانی محصول
export async function updateProduct(id: number, productData: {
  title?: string
  price?: number
  description?: string
  status?: string
  images?: string // JSON string array
}) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const updates: string[] = []
  const values: any[] = []
  
  if (productData.title !== undefined) {
    updates.push('title = ?')
    values.push(productData.title.trim())
  }
  if (productData.price !== undefined) {
    updates.push('price = ?')
    values.push(productData.price)
  }
  if (productData.description !== undefined) {
    updates.push('description = ?')
    values.push(productData.description.trim())
  }
  if (productData.status !== undefined) {
    updates.push('status = ?')
    values.push(productData.status)
  }
  if (productData.images !== undefined) {
    updates.push('images = ?')
    values.push(productData.images)
  }
  
  if (updates.length === 0) {
    return { success: false, error: 'هیچ فیلدی برای به‌روزرسانی مشخص نشده است' }
  }
  
  values.push(id)
  
  const result = await db.run(
    `UPDATE products 
     SET ${updates.join(', ')}
     WHERE id = ?`,
    ...values
  )
  
  return {
    success: result.changes > 0,
    changes: result.changes
  }
}

// حذف کاربر و تمام اطلاعات مرتبط
export async function deleteUser(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    // دریافت تمام محصولات کاربر برای حذف عکس‌ها
    const products = await db.all('SELECT * FROM products WHERE user_id = ?', userId)
    
    // حذف عکس‌های محصولات
    const fs = require('fs').promises
    const path = require('path')
    
    for (const product of products) {
      if (product.images) {
        try {
          const images = JSON.parse(product.images)
          for (const imagePath of images) {
            if (imagePath) {
              const fullPath = path.join(process.cwd(), 'public', imagePath)
              try {
                await fs.unlink(fullPath)
              } catch (err) {
                // اگر فایل وجود نداشت، خطا را نادیده بگیر
                console.warn(`Could not delete image: ${fullPath}`, err)
              }
            }
          }
        } catch (err) {
          console.warn('Error parsing images for product:', product.id, err)
        }
      }
    }
    
    // حذف تمام محصولات کاربر
    await db.run('DELETE FROM products WHERE user_id = ?', userId)
    
    // حذف اطلاعات کاربر
    const result = await db.run('DELETE FROM ads WHERE id = ?', userId)
    
    return {
      success: result.changes > 0,
      changes: result.changes
    }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ==================== توابع چت ====================

// دریافت یا ایجاد گفتگو بین دو کاربر
export async function getOrCreateConversation(user1Id: number, user2Id: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  // اطمینان از اینکه user1_id همیشه کوچکتر از user2_id باشد (برای جلوگیری از duplicate)
  const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
  
  // بررسی وجود گفتگو
  let conversation = await db.get(
    'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?',
    userId1,
    userId2
  )
  
  // اگر گفتگو وجود نداشت، ایجاد کن
  if (!conversation) {
    const result = await db.run(
      'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
      userId1,
      userId2
    )
    conversation = await db.get('SELECT * FROM conversations WHERE id = ?', result.lastID)
  }
  
  return conversation
}

// دریافت تمام گفتگوهای یک کاربر
export async function getConversationsForUser(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  // دریافت گفتگوهایی که کاربر در آن‌ها شرکت دارد
  const conversations = await db.all(
    `SELECT c.*, 
       CASE 
         WHEN c.user1_id = ? THEN c.user2_id 
         ELSE c.user1_id 
       END as other_user_id,
       (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_text,
       (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND status = 'sent') as unread_count
     FROM conversations c
     WHERE c.user1_id = ? OR c.user2_id = ?
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    userId,
    userId,
    userId,
    userId
  )
  
  // دریافت اطلاعات کاربر دیگر برای هر گفتگو
  for (const conv of conversations) {
    const otherUser = await db.get('SELECT id, username, phone FROM ads WHERE id = ?', conv.other_user_id)
    conv.other_user = otherUser
  }
  
  return conversations
}

// ارسال پیام
export async function sendMessage(conversationId: number, senderId: number, receiverId: number, text: string) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  // ارسال پیام
  const result = await db.run(
    'INSERT INTO messages (conversation_id, sender_id, receiver_id, text, status) VALUES (?, ?, ?, ?, ?)',
    conversationId,
    senderId,
    receiverId,
    text,
    'sent'
  )
  
  // به‌روزرسانی last_message_at در گفتگو
  await db.run(
    'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
    conversationId
  )
  
  // دریافت پیام ایجاد شده
  const message = await db.get('SELECT * FROM messages WHERE id = ?', result.lastID)
  
  return {
    id: result.lastID,
    success: true,
    message
  }
}

// دریافت پیام‌های یک گفتگو
export async function getMessagesForConversation(conversationId: number, userId: number, limit: number = 100) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  // بررسی اینکه کاربر در این گفتگو شرکت دارد
  const conversation = await db.get(
    'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
    conversationId,
    userId,
    userId
  )
  
  if (!conversation) {
    throw new Error('گفتگو یافت نشد یا شما دسترسی ندارید')
  }
  
  // دریافت پیام‌ها
  const messages = await db.all(
    `SELECT * FROM messages 
     WHERE conversation_id = ? 
     ORDER BY created_at ASC 
     LIMIT ?`,
    conversationId,
    limit
  )
  
  return messages
}

// علامت‌گذاری پیام‌ها به عنوان خوانده شده
export async function markMessagesAsRead(conversationId: number, userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const result = await db.run(
    `UPDATE messages 
     SET status = 'seen' 
     WHERE conversation_id = ? AND receiver_id = ? AND status = 'sent'`,
    conversationId,
    userId
  )
  
  return {
    success: result.changes > 0,
    changes: result.changes
  }
}

// دریافت تعداد پیام‌های خوانده نشده برای یک کاربر
export async function getUnreadCountForUser(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const result = await db.get(
    `SELECT COUNT(*) as count 
     FROM messages m
     INNER JOIN conversations c ON m.conversation_id = c.id
     WHERE m.receiver_id = ? AND m.status = 'sent' 
     AND (c.user1_id = ? OR c.user2_id = ?)`,
    userId,
    userId,
    userId
  )
  
  return result?.count || 0
}

// دریافت تمام کاربران (برای شروع گفتگوی جدید)
export async function getAllUsersForChat(currentUserId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  const users = await db.all(
    'SELECT id, username, phone, created_at FROM ads WHERE id != ? ORDER BY username ASC',
    currentUserId
  )
  
  return users
}

// ==================== توابع Followers ====================

// دنبال کردن یک کاربر
export async function followUser(followerId: number, followingId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  if (followerId === followingId) {
    return { success: false, error: 'شما نمی‌توانید خودتان را دنبال کنید' }
  }
  
  try {
    // بررسی وجود کاربر
    const user = await db.get('SELECT id FROM ads WHERE id = ?', followingId)
    if (!user) {
      return { success: false, error: 'کاربر یافت نشد' }
    }
    
    // بررسی اینکه قبلاً دنبال شده است یا نه
    const existing = await db.get(
      'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?',
      followerId,
      followingId
    )
    
    if (existing) {
      return { success: false, error: 'شما قبلاً این کاربر را دنبال کرده‌اید' }
    }
    
    // اضافه کردن به جدول followers
    await db.run(
      'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)',
      followerId,
      followingId
    )
    
    return { success: true }
  } catch (error: any) {
    console.error('Error following user:', error)
    return { success: false, error: error.message || 'خطا در دنبال کردن کاربر' }
  }
}

// آنفالو کردن یک کاربر
export async function unfollowUser(followerId: number, followingId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.run(
      'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
      followerId,
      followingId
    )
    
    return { success: result.changes > 0 }
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: error.message || 'خطا در آنفالو کردن کاربر' }
  }
}

// بررسی اینکه آیا یک کاربر، کاربر دیگری را دنبال می‌کند
export async function isFollowing(followerId: number, followingId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.get(
      'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?',
      followerId,
      followingId
    )
    
    return !!result
  } catch (error: any) {
    console.error('Error checking follow status:', error)
    return false
  }
}

// دریافت تعداد دنبال‌کننده‌های یک کاربر
export async function getFollowersCount(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
      userId
    )
    
    return result?.count || 0
  } catch (error: any) {
    console.error('Error getting followers count:', error)
    return 0
  }
}

// دریافت تعداد کاربرانی که یک کاربر دنبال می‌کند
export async function getFollowingCount(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
      userId
    )
    
    return result?.count || 0
  } catch (error: any) {
    console.error('Error getting following count:', error)
    return 0
  }
}

// اضافه کردن یا به‌روزرسانی امتیاز
export async function addOrUpdateRating(ratedUserId: number, raterUserId: number, rating: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    // بررسی اینکه آیا قبلاً امتیاز داده شده است
    const existing = await db.get(
      'SELECT id FROM ratings WHERE rated_user_id = ? AND rater_user_id = ?',
      ratedUserId,
      raterUserId
    )
    
    if (existing) {
      // به‌روزرسانی امتیاز موجود
      await db.run(
        'UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE rated_user_id = ? AND rater_user_id = ?',
        rating,
        ratedUserId,
        raterUserId
      )
    } else {
      // اضافه کردن امتیاز جدید
      await db.run(
        'INSERT INTO ratings (rated_user_id, rater_user_id, rating) VALUES (?, ?, ?)',
        ratedUserId,
        raterUserId,
        rating
      )
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Error adding/updating rating:', error)
    return { success: false, error: error.message || 'خطا در ثبت امتیاز' }
  }
}

// دریافت میانگین امتیاز یک کاربر
export async function getUserAverageRating(userId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.get(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE rated_user_id = ?',
      userId
    )
    
    return {
      average: result?.avg_rating ? parseFloat(result.avg_rating.toFixed(2)) : 0,
      count: result?.count || 0
    }
  } catch (error: any) {
    console.error('Error getting user average rating:', error)
    return { average: 0, count: 0 }
  }
}

// دریافت امتیاز داده شده توسط یک کاربر به کاربر دیگر
export async function getUserRating(ratedUserId: number, raterUserId: number) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const result = await db.get(
      'SELECT rating FROM ratings WHERE rated_user_id = ? AND rater_user_id = ?',
      ratedUserId,
      raterUserId
    )
    
    return result?.rating || null
  } catch (error: any) {
    console.error('Error getting user rating:', error)
    return null
  }
}

// دریافت لیست رتبه‌بندی کاربران (Leaderboard)
export async function getLeaderboard(limit: number = 50) {
  const database = getDatabase()
  await initializeTable(database)
  const db = promisifyDb(database)
  
  try {
    const leaderboard = await db.all(`
      SELECT 
        a.id,
        a.username,
        a.store_name,
        a.profile_image,
        a.is_store,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM ads a
      LEFT JOIN ratings r ON a.id = r.rated_user_id
      GROUP BY a.id
      HAVING rating_count > 0
      ORDER BY average_rating DESC, rating_count DESC
      LIMIT ?
    `, limit)
    
    return leaderboard.map((item: any) => ({
      ...item,
      average_rating: parseFloat(item.average_rating.toFixed(2))
    }))
  } catch (error: any) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}
