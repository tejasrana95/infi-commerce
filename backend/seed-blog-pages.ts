import mongoose from 'mongoose';
import BlogPost from './src/models/BlogPost';
import Page from './src/models/Page';
import BlogCategory from './src/models/BlogCategory';
import dotenv from 'dotenv';

dotenv.config();

const storeIds = [
    '693aa7e1f2f977c751e3d233',
    '693aa91e88efc150c73aa232'
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/infi-commerce');
        console.log('Connected to MongoDB');

        for (const storeId of storeIds) {
            console.log(`Seeding for store: ${storeId}`);

            // Clear existing data for these stores to avoid duplicates during seeding
            await BlogCategory.deleteMany({ storeId });
            await BlogPost.deleteMany({ storeId });
            await Page.deleteMany({ storeId });

            // 1. Seed Blog Categories
            const categories = await BlogCategory.insertMany([
                {
                    storeId,
                    name: 'Technology',
                    slug: 'technology',
                    description: 'Latest in tech, gadgets, and software development.',
                    isActive: true,
                    sortOrder: 1
                },
                {
                    storeId,
                    name: 'Lifestyle',
                    slug: 'lifestyle',
                    description: 'Modern lifestyle, health, and wellness tips.',
                    isActive: true,
                    sortOrder: 2
                },
                {
                    storeId,
                    name: 'Business',
                    slug: 'business',
                    description: 'E-commerce insights, marketing strategies, and business growth.',
                    isActive: true,
                    sortOrder: 3
                },
                {
                    storeId,
                    name: 'Innovation',
                    slug: 'innovation',
                    description: 'Future trends and innovative solutions.',
                    isActive: true,
                    sortOrder: 4
                }
            ]);

            // 2. Seed Blog Posts
            await BlogPost.insertMany([
                {
                    storeId,
                    title: 'Welcome to our New Blog',
                    slug: 'welcome-to-our-new-blog',
                    excerpt: 'We are thrilled to launch our new blog section dedicated to sharing insights and stories.',
                    content: '<h2>Introduction</h2><p>Welcome to our official blog! This is where we will be sharing the latest news, updates, and in-depth articles about our products and industry trends.</p><p>We believe in building a community around our brand and this blog is a step towards that. Stay tuned for exciting content!</p>',
                    status: 'published',
                    categoryIds: [categories[0]._id],
                    author: { name: 'Tejas Rana' },
                    isFeatured: true,
                    publishedAt: new Date(),
                    featuredImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60'
                },
                {
                    storeId,
                    title: 'The Future of E-commerce in 2025',
                    slug: 'future-of-ecommerce-2025',
                    excerpt: 'Exploring the trends that will shape the online shopping experience in the coming years.',
                    content: '<h3>AI and Personalization</h3><p>Artificial Intelligence continues to revolutionize how customers shop online. From personalized recommendations to AI-driven customer support, the experience is becoming more seamless.</p><h3>Sustainability</h3><p>Consumers are increasingly looking for eco-friendly brands. Sustainable packaging and ethical sourcing are no longer optional.</p>',
                    status: 'published',
                    categoryIds: [categories[2]._id, categories[3]._id],
                    author: { name: 'Admin' },
                    publishedAt: new Date(),
                    featuredImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60'
                },
                {
                    storeId,
                    title: '10 Productivity Hacks for Remote Workers',
                    slug: '10-productivity-hacks-remote',
                    excerpt: 'Maximize your output while working from the comfort of your home.',
                    content: '<ul><li>Set up a dedicated workspace.</li><li>Stick to a routine.</li><li>Take regular breaks using the Pomodoro technique.</li><li>Use noise-canceling headphones.</li></ul>',
                    status: 'published',
                    categoryIds: [categories[1]._id],
                    author: { name: 'Sarah Wilson' },
                    publishedAt: new Date(),
                    featuredImage: 'https://images.unsplash.com/photo-1484417824217-c9242b5a1f50?w=800&auto=format&fit=crop&q=60'
                }
            ]);

            // 3. Seed Static Pages
            await Page.insertMany([
                {
                    storeId,
                    title: 'About Our Mission',
                    slug: 'about-us',
                    content: '<h1>Our Mission</h1><p>We are a company dedicated to providing high-quality solutions for our clients. Our team is passionate about innovation and excellence.</p><p>Founded in 2020, we have grown from a small startup to a leading provider in the industry.</p>',
                    status: 'published',
                    useLayout: false
                },
                {
                    storeId,
                    title: 'Contact Information',
                    slug: 'contact-us',
                    content: '<h1>Get in Touch</h1><p>Have questions? We would love to hear from you.</p><ul><li>Email: support@inficommerce.com</li><li>Phone: +1 (555) 123-4567</li><li>Address: 123 Tech Lane, Silicon Valley, CA</li></ul>',
                    status: 'published',
                    useLayout: false
                },
                {
                    storeId,
                    title: 'Privacy Policy',
                    slug: 'privacy-policy',
                    content: '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy outlines how we collect, use, and protect your data.</p><p>We collect information only necessary to provide you with the best experience.</p>',
                    status: 'published',
                    useLayout: false
                },
                {
                    storeId,
                    title: 'Terms & Conditions',
                    slug: 'terms-and-conditions',
                    content: '<h1>Terms and Conditions</h1><p>By using our services, you agree to comply with the following terms and conditions.</p>',
                    status: 'published',
                    useLayout: false
                }
            ]);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
