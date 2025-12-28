// Fake Books Data - Add to Database
// You can use this data via the POST /books API endpoint or add to seed file

export const fakeBooksData = [
    {
        isbn: "978-1-234-56789-0",
        title: "The Midnight Garden",
        author: "Elena Rodriguez",
        publisher: "Moonlight Press",
        edition: "First Edition",
        publicationYear: 2022,
        language: "English",
        genre: "Fiction",
        category: "Mystery",
        subCategory: "Detective Fiction",
        pages: 342,
        format: "Paperback",
        description: "A thrilling mystery set in a Victorian mansion where secrets bloom in the garden after dark. Detective Sarah Chen must unravel the mystery of the midnight visitor before another tragedy strikes.",
        totalCopies: 5,
        bookValue: 450.00,
        securityDeposit: 150.00,
        loanPeriodDays: 14,
        finePerDay: 5.00,
        maxRenewals: 2,
        isDeliveryEligible: true,
        coverImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400"
    },
    {
        isbn: "978-0-987-65432-1",
        title: "Code & Coffee: A Developer's Journey",
        author: "Marcus Thompson",
        publisher: "Tech Tales Publishing",
        edition: "First Edition",
        publicationYear: 2023,
        language: "English",
        genre: "Non-Fiction",
        category: "Technology",
        subCategory: "Software Development",
        pages: 289,
        format: "Paperback",
        description: "From junior developer to tech lead, this memoir chronicles the highs and lows of a career in software development. Packed with practical advice, war stories, and lessons learned from building scalable systems.",
        totalCopies: 8,
        bookValue: 550.00,
        securityDeposit: 200.00,
        loanPeriodDays: 14,
        finePerDay: 5.00,
        maxRenewals: 2,
        isDeliveryEligible: true,
        coverImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400"
    },
    {
        isbn: "978-1-111-22233-4",
        title: "Stars Beyond the Horizon",
        author: "Priya Sharma",
        publisher: "Galaxy Books",
        edition: "First Edition",
        publicationYear: 2021,
        language: "English",
        genre: "Science Fiction",
        category: "Space Opera",
        subCategory: "Hard Science Fiction",
        pages: 456,
        format: "Hardcover",
        description: "In the year 2247, humanity has colonized the solar system. Commander Aria Khan leads the first mission beyond our solar system, discovering an ancient alien civilization and a threat that could end all life.",
        totalCopies: 6,
        bookValue: 650.00,
        securityDeposit: 250.00,
        loanPeriodDays: 14,
        finePerDay: 5.00,
        maxRenewals: 2,
        isDeliveryEligible: true,
        coverImageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400"
    },
    {
        isbn: "978-2-345-67890-1",
        title: "The Art of Mindful Living",
        author: "Dr. James Chen",
        publisher: "Wellness House",
        edition: "Revised Edition",
        publicationYear: 2023,
        language: "English",
        genre: "Non-Fiction",
        category: "Self-Help",
        subCategory: "Mindfulness & Meditation",
        pages: 198,
        format: "Paperback",
        description: "A practical guide to incorporating mindfulness into daily life. With exercises, meditations, and real-world examples, Dr. Chen shows how small changes can lead to lasting peace and happiness.",
        totalCopies: 10,
        bookValue: 350.00,
        securityDeposit: 100.00,
        loanPeriodDays: 14,
        finePerDay: 5.00,
        maxRenewals: 2,
        isDeliveryEligible: true,
        coverImageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400"
    }
];

// SQL INSERT Statements (if you prefer to add directly to database)
/*
INSERT INTO "Book" (id, isbn, title, author, publisher, "publicationYear", genre, category, language, "totalPages", description, "totalCopies", "availableCopies", "coverImage", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '978-1-234-56789-0', 'The Midnight Garden', 'Elena Rodriguez', 'Moonlight Press', 2022, 'Fiction', 'Mystery', 'English', 342, 'A thrilling mystery set in a Victorian mansion where secrets bloom in the garden after dark. Detective Sarah Chen must unravel the mystery of the midnight visitor before another tragedy strikes.', 5, 5, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400', NOW(), NOW()),

  (gen_random_uuid(), '978-0-987-65432-1', 'Code & Coffee: A Developer''s Journey', 'Marcus Thompson', 'Tech Tales Publishing', 2023, 'Non-Fiction', 'Technology', 'English', 289, 'From junior developer to tech lead, this memoir chronicles the highs and lows of a career in software development. Packed with practical advice, war stories, and lessons learned from building scalable systems.', 8, 8, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400', NOW(), NOW()),

  (gen_random_uuid(), '978-1-111-22233-4', 'Stars Beyond the Horizon', 'Priya Sharma', 'Galaxy Books', 2021, 'Science Fiction', 'Space Opera', 'English', 456, 'In the year 2247, humanity has colonized the solar system. Commander Aria Khan leads the first mission beyond our solar system, discovering an ancient alien civilization and a threat that could end all life.', 6, 6, 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400', NOW(), NOW()),

  (gen_random_uuid(), '978-2-345-67890-1', 'The Art of Mindful Living', 'Dr. James Chen', 'Wellness House', 2023, 'Non-Fiction', 'Self-Help', 'English', 198, 'A practical guide to incorporating mindfulness into daily life. With exercises, meditations, and real-world examples, Dr. Chen shows how small changes can lead to lasting peace and happiness.', 10, 10, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', NOW(), NOW());
*/

// API Request Examples (Using cURL)
/*
# Book 1: The Midnight Garden
curl -X POST http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-1-234-56789-0",
    "title": "The Midnight Garden",
    "author": "Elena Rodriguez",
    "publisher": "Moonlight Press",
    "publicationYear": 2022,
    "genre": "Fiction",
    "category": "Mystery",
    "language": "English",
    "totalPages": 342,
    "description": "A thrilling mystery set in a Victorian mansion where secrets bloom in the garden after dark. Detective Sarah Chen must unravel the mystery of the midnight visitor before another tragedy strikes.",
    "totalCopies": 5,
    "coverImage": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400"
  }'

# Book 2: Code & Coffee
curl -X POST http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-0-987-65432-1",
    "title": "Code & Coffee: A Developer'\''s Journey",
    "author": "Marcus Thompson",
    "publisher": "Tech Tales Publishing",
    "publicationYear": 2023,
    "genre": "Non-Fiction",
    "category": "Technology",
    "language": "English",
    "totalPages": 289,
    "description": "From junior developer to tech lead, this memoir chronicles the highs and lows of a career in software development.",
    "totalCopies": 8,
    "coverImage": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400"
  }'

# Book 3: Stars Beyond the Horizon
curl -X POST http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-1-111-22233-4",
    "title": "Stars Beyond the Horizon",
    "author": "Priya Sharma",
    "publisher": "Galaxy Books",
    "publicationYear": 2021,
    "genre": "Science Fiction",
    "category": "Space Opera",
    "language": "English",
    "totalPages": 456,
    "description": "In the year 2247, humanity has colonized the solar system. Commander Aria Khan leads the first mission beyond our solar system.",
    "totalCopies": 6,
    "coverImage": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400"
  }'

# Book 4: The Art of Mindful Living
curl -X POST http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-2-345-67890-1",
    "title": "The Art of Mindful Living",
    "author": "Dr. James Chen",
    "publisher": "Wellness House",
    "publicationYear": 2023,
    "genre": "Non-Fiction",
    "category": "Self-Help",
    "language": "English",
    "totalPages": 198,
    "description": "A practical guide to incorporating mindfulness into daily life.",
    "totalCopies": 10,
    "coverImage": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400"
  }'
*/
