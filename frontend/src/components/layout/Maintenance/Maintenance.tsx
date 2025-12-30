import React from 'react';
import styles from './Maintenance.module.scss';

export const Maintenance: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Space Themed Icon/Visual */}
                <div className={styles.visualContainer}>
                    <div className={styles.planet}>
                        <div className={styles.ring}></div>
                        <div className={styles.crater}></div>
                        <div className={styles.crater}></div>
                        <div className={styles.crater}></div>
                    </div>
                </div>

                {/* Stars Background */}
                <div className={styles.stars}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={styles.star} style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${1 + Math.random() * 2}s`
                        }}></div>
                    ))}
                </div>

                {/* Astronaut */}
                <div className={styles.astronaut}>
                    <div className={styles.helmet}>
                        <div className={styles.visor}></div>
                    </div>
                    <div className={styles.body}></div>
                    <div className={styles.armLeft}></div>
                    <div className={styles.armRight}></div>
                    <div className={styles.legLeft}></div>
                    <div className={styles.legRight}></div>
                </div>

                {/* Message */}
                <h1 className={styles.title}>System Maintenance</h1>
                <p className={styles.message}>
                    Our space station is currently undergoing scheduled maintenance.
                    We're upgrading our warp engines to serve you better.
                    We'll be back online in a few light-years (very soon)!
                </p>

                {/* Optional: Social Links or Contact Info */}
                <div className={styles.footer}>
                    <p>Stay tuned on our social channels for updates.</p>
                </div>
            </div>
        </div>
    );
};
