'use client';

import Link from 'next/link';
import styles from './page.module.scss';

export default function AccountPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.sidebar}>
                    <div className={styles.profile}>
                        <div className={styles.avatar}></div>
                        <h3>John Doe</h3>
                        <p>john@example.com</p>
                    </div>
                    <nav className={styles.nav}>
                        <Link href="/account" className={styles.active}>Dashboard</Link>
                        <Link href="/account/orders">Orders</Link>
                        <Link href="/account/addresses">Addresses</Link>
                        <Link href="/account/wishlist">Wishlist</Link>
                        <Link href="/account/settings">Settings</Link>
                        <button className={styles.logout}>Logout</button>
                    </nav>
                </div>

                <main className={styles.main}>
                    <h1>My Account</h1>

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h3>Recent Orders</h3>
                            <p>You have 0 orders</p>
                            <Link href="/account/orders">View all orders →</Link>
                        </div>
                        <div className={styles.card}>
                            <h3>Saved Addresses</h3>
                            <p>0 addresses saved</p>
                            <Link href="/account/addresses">Manage addresses →</Link>
                        </div>
                        <div className={styles.card}>
                            <h3>Wishlist</h3>
                            <p>0 items saved</p>
                            <Link href="/account/wishlist">View wishlist →</Link>
                        </div>
                        <div className={styles.card}>
                            <h3>Account Settings</h3>
                            <p>Update your profile</p>
                            <Link href="/account/settings">Edit settings →</Link>
                        </div>
                    </div>

                    <div className={styles.notice}>
                        <p>🚧 Account functionality under development</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
