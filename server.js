const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Файл для хранения данных
const DATA_FILE = path.join(__dirname, 'marketplace-data.json');

// Загрузка данных
function loadMarketplace() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (error) {
        console.log('Ошибка загрузки данных:', error);
    }
    
    // Демо-данные
    return [
        {
            globalId: 'demo_1',
            coin: { 
                id: 1, 
                name: "Серебряный SCoin", 
                icon: "⚪", 
                price: 25, 
                rarity: "rare", 
                description: "Монета из чистого серебра", 
                edition: "Premium" 
            },
            price: 40,
            sellerId: 'user_123',
            sellerName: 'Алексей',
            sellerRating: 4.8,
            timestamp: Date.now() - 3600000
        },
        {
            globalId: 'demo_2',
            coin: { 
                id: 3, 
                name: "Золотой SCoin", 
                icon: "🟡", 
                price: 50, 
                rarity: "epic", 
                description: "Роскошная золотая монета", 
                edition: "Deluxe" 
            },
            price: 80,
            sellerId: 'user_456',
            sellerName: 'Мария',
            sellerRating: 4.9,
            timestamp: Date.now() - 7200000
        }
    ];
}

// Сохранение данных
function saveMarketplace(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.log('Ошибка сохранения данных:', error);
        return false;
    }
}

let marketplace = loadMarketplace();

// API endpoints
app.get('/api/marketplace', (req, res) => {
    try {
        res.json(marketplace);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/marketplace', (req, res) => {
    try {
        const newItem = {
            ...req.body,
            globalId: `global_${req.body.sellerId}_${Date.now()}`,
            timestamp: Date.now()
        };
        
        // Валидация
        if (!newItem.coin || !newItem.price || !newItem.sellerId) {
            return res.status(400).json({ error: 'Неверные данные' });
        }
        
        marketplace.push(newItem);
        saveMarketplace(marketplace);
        res.json({ success: true, item: newItem });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка добавления' });
    }
});

app.delete('/api/marketplace/:id', (req, res) => {
    try {
        const itemIndex = marketplace.findIndex(item => item.globalId === req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Предложение не найдено' });
        }
        
        // Проверка владельца
        const userId = req.query.userId;
        if (marketplace[itemIndex].sellerId !== userId) {
            return res.status(403).json({ error: 'Нет прав для удаления' });
        }
        
        marketplace.splice(itemIndex, 1);
        saveMarketplace(marketplace);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления' });
    }
});

// Статус сервера
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        items: marketplace.length,
        timestamp: new Date().toISOString()
    });
});

// Обслуживание клиента
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ SCoinS PRO Server running on port ${PORT}`);
});

module.exports = app;