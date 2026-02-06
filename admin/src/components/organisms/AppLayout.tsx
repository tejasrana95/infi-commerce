'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Badge,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationMenu from './NotificationMenu';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import StyleIcon from '@mui/icons-material/Style';
import StoreIcon from '@mui/icons-material/Store';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import PublicIcon from '@mui/icons-material/Public';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import LabelImportantIcon from '@mui/icons-material/LabelImportant';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, getRole, nameBuilder } from '@/utils/nameBuilder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DiscountIcon from '@mui/icons-material/Discount';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CommentIcon from '@mui/icons-material/Comment';
import WebIcon from '@mui/icons-material/Web';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ArticleIcon from '@mui/icons-material/Article';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import BallotIcon from '@mui/icons-material/Ballot';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import PanoramaWideAngleIcon from '@mui/icons-material/PanoramaWideAngle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import UndoIcon from '@mui/icons-material/Undo';
import api from '@/lib/api';
import Image from 'next/image';
import { QrCode } from 'lucide-react';
const drawerWidth = 260;

interface NavItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'POS Sessions', href: '/pos-sessions', icon: <ReceiptLongIcon /> },
  { name: 'Orders', href: '/orders', icon: <ShoppingCartIcon /> },
  { name: 'Returns', href: '/returns', icon: <UndoIcon /> },
  { name: 'Accounting', href: '/accounting', icon: <AccountBalanceIcon /> },
  { name: 'Customers', href: '/customers', icon: <PeopleIcon /> },
  {
    name: 'Catalog',
    icon: <InventoryIcon />,
    children: [
      { name: 'Products', href: '/products', icon: <InventoryIcon /> },
      { name: 'Categories', href: '/categories', icon: <CategoryIcon /> },
      { name: 'Product Options', href: '/product-options', icon: <StyleIcon /> },
      { name: 'Specifications', href: '/attributes', icon: <ChecklistIcon /> },
      { name: 'Brands', href: '/brands', icon: <LabelImportantIcon /> },
      { name: 'Reviews', href: '/reviews', icon: <CommentIcon /> },
      { name: 'Barcode Generator', href: '/barcode', icon: <QrCode /> },
    ],
  },
  {
    name: 'Sales & Marketing',
    icon: <LocalOfferIcon />,
    children: [
      { name: 'Sales', href: '/sales', icon: <LocalOfferIcon /> },
      { name: 'Coupons', href: '/coupons', icon: <DiscountIcon /> },
    ],
  },
  {
    name: 'Storefront',
    icon: <WebIcon />,
    children: [
      { name: 'Layouts', href: '/layouts', icon: <DashboardCustomizeIcon /> },
      { name: 'Menus', href: '/menus', icon: <MenuIcon /> },
      { name: 'Pages', href: '/pages', icon: <ArticleIcon /> },
      { name: 'Hero Sliders', href: '/hero-sliders', icon: <BurstModeIcon /> },
      { name: 'Banners', href: '/banners', icon: <PanoramaWideAngleIcon /> },
      { name: 'Banner Sliders', href: '/banner-sliders', icon: <ViewCarouselIcon /> },
      { name: 'Testimonials', href: '/testimonials', icon: <FormatQuoteIcon /> },
      { name: 'Brand Showcases', href: '/brand-showcases', icon: <WorkspacesIcon /> },
      { name: 'Form Builder', href: '/forms', icon: <FormatListBulletedIcon /> },
      {
        name: 'Content Card',
        icon: <BallotIcon />,
        children: [
          { name: 'Content List', href: '/content-cards/cards', icon: <BallotIcon /> },
          { name: 'Categories', href: '/content-cards/categories', icon: <CategoryIcon /> },
        ],
      },
      { name: 'Newsletter Subscribers', href: '/newsletter', icon: <MarkunreadMailboxIcon /> },

      {
        name: 'Blog',
        icon: <RssFeedIcon />,
        children: [
          { name: 'Posts', href: '/blog/posts', icon: <ArticleIcon /> },
          { name: 'Categories', href: '/blog/categories', icon: <CategoryIcon /> },
        ],
      },
    ],
  },
  {
    name: 'Settings',
    icon: <SettingsOutlinedIcon />,
    children: [
      { name: 'Admin Users', href: '/admins', icon: <AdminPanelSettingsIcon /> },
      { name: 'Taxes', href: '/taxes', icon: <ReceiptLongIcon /> },
      { name: 'Currencies', href: '/currencies', icon: <CurrencyExchangeIcon /> },
      { name: 'Geo', href: '/geo', icon: <PublicIcon /> },
      { name: 'Geo Groups', href: '/geo-groups', icon: <GroupWorkIcon /> },
      { name: 'Shipping', href: '/shipping', icon: <LocalShippingIcon /> },
      { name: 'Payment Gateways', href: '/payment-gateways', icon: <PaymentIcon /> },
      { name: 'Files', href: '/files', icon: <FolderIcon /> },
      { name: 'Notifications Queue', href: '/notifications', icon: <NotificationsOutlinedIcon /> },
      { name: 'Notification Templates', href: '/notification-templates', icon: <DescriptionIcon /> },
      { name: 'Stores', href: '/stores', icon: <StoreIcon /> },
      { name: 'Settings', href: '/settings', icon: <SettingsOutlinedIcon /> },
    ],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const NavItemComponent = memo(({
  item,
  pathname,
  level = 0,
  onNavigate
}: {
  item: NavItem;
  pathname: string;
  level?: number;
  onNavigate: () => void;
}) => {
  const hasChildren = item.children && item.children.length > 0;

  // Recursive function to check if any child (at any depth) is active
  const isChildActive = useCallback((navItem: NavItem): boolean => {
    if (navItem.href && (pathname === navItem.href || pathname.startsWith(`${navItem.href}/`))) {
      return true;
    }
    if (navItem.children) {
      return navItem.children.some(child => isChildActive(child));
    }
    return false;
  }, [pathname]);

  const isActive = item.href ? (pathname === item.href || pathname.startsWith(`${item.href}/`)) : false;
  const isParentActive = useMemo(() => {
    if (!item.children) return false;
    return item.children.some(child => isChildActive(child));
  }, [item.children, isChildActive]);

  // Keep menu open if any child is active
  const [open, setOpen] = useState(isParentActive || false);

  // Update open state when pathname changes
  useEffect(() => {
    if (isParentActive) {
      setOpen(true);
    }
  }, [isParentActive]);

  const handleClick = () => {
    if (hasChildren) {
      setOpen(!open);
    } else if (item.href) {
      onNavigate();
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        component={item.href && !hasChildren ? Link : 'div'}
        href={item.href || undefined}
        selected={isActive}
        sx={{
          borderRadius: '8px',
          minHeight: 42,
          py: 1.25,
          pl: level * 2 + 1.5,
          mb: 0.5,
          backgroundColor: isActive
            ? 'primary.main'
            : isParentActive && !hasChildren
              ? 'action.hover'
              : 'transparent',
          color: isActive ? 'white' : isParentActive ? 'primary.main' : 'text.primary',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: isActive
              ? 'primary.dark'
              : level === 0
                ? 'action.hover'
                : 'action.selected',
            transform: level === 0 ? 'translateX(2px)' : 'none',
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive ? 'white' : isParentActive ? 'primary.main' : 'text.secondary',
            minWidth: 36,
            transition: 'color 0.2s',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.name}
          primaryTypographyProps={{
            fontWeight: isActive || isParentActive ? 600 : 500,
            fontSize: level === 0 ? '0.875rem' : '0.8125rem',
          }}
        />
        {item.badge !== undefined && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              fontWeight: 600,
              bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'primary.50',
              color: isActive ? 'white' : 'primary.main',
            }}
          />
        )}
        {hasChildren && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: isParentActive ? 'primary.main' : 'text.secondary',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
            }}
          >
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Box>
        )}
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{
            pl: 0.5,
            borderLeft: '2px solid',
            borderColor: 'divider',
            ml: 3,
            my: 0.5,
          }}>
            {item.children!.map((child) => (
              <NavItemComponent
                key={child.name}
                item={child}
                pathname={pathname}
                level={level + 1}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
});

NavItemComponent.displayName = 'NavItemComponent';

const AppLayout = memo(({ children }: AppLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [branding, setBranding] = useState({ name: 'Infi Commerce', logo: '', favicon: '' });
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fetchBranding = async () => {
    try {
      const response = await api.get('/settings/admin-branding');
      if (response.data.success && response.data.branding && response.data.branding.name && response.data.branding.logo && response.data.branding.favicon) {
        setBranding(response.data.branding);
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };
  useEffect(() => {

    fetchBranding();
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
    handleMenuClose();
  }, [logout, router, handleMenuClose]);

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const userInitials = useMemo(() => {
    return getInitials(nameBuilder(user));
  }, [user]);

  const filteredNavigationItems = useMemo(() => {

    if (!user) return [];
    if (user?.role === 'super_admin') return navigationItems;
    return navigationItems
      .map(item => {
        const newItem = { ...item };

        if (newItem.children) {
          newItem.children = newItem.children.filter(child => {
            if (user?.role === 'store_admin') {
              // Store Admin restrictions
              if (newItem.name === 'Sales & Marketing' && child.name === 'Stores') return false;
              if (newItem.name === 'Storefront' && child.name !== 'Blog') return false;
              if (newItem.name === 'Settings') return false;
              return true;
            }

            if (user?.role === 'admin') {
              // Admin restrictions
              if (newItem.name === 'Sales & Marketing' && child.name === 'Stores') return false;
              if (newItem.name === 'Settings') {
                const restrictedSettings = [
                  'Files', 'Notifications Queue', 'Notification Templates',
                  'Payment Gateways', 'Admin Users', 'Shipping', 'Geo',
                  'Geo Groups', 'Currencies', 'Taxes', 'Settings'
                ];
                return !restrictedSettings.includes(child.name);
              }
            }

            return true;
          });
        }

        return newItem;
      })
      .filter(item => {
        // Root level filtering
        if (user?.role === 'store_admin') {
          if (item.name === 'Settings') return false;
        }

        // Filter out empty parents
        if (item.children && item.children.length === 0) {
          if (['Settings', 'Storefront', 'Sales & Marketing'].includes(item.name)) {
            return false;
          }
        }

        return true;
      }) as NavItem[];
  }, [user, navigationItems]);

  const drawer = useMemo(
    () => (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',

      }}>
        {/* Branding Header */}
        <Box
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} position="relative" zIndex={1}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: branding.logo ? 'white' : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                fontWeight: 700,
                fontSize: '1.25rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}
            >
              {branding.logo ? (
                <Image src={branding.logo} alt="L" width={44} height={44} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                branding.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </Box>
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2, mb: 0.25 }}>
                {branding.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.6875rem', letterSpacing: '0.5px' }}>
                ADMIN PORTAL
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 1.5,
          scrollbarGutter: 'stable',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 3,
            '&:hover': {
              bgcolor: 'text.disabled',
            },
          },
        }}>
          <List component="nav" disablePadding>
            {filteredNavigationItems.map((item) => (
              <NavItemComponent
                key={item.name}
                item={item}
                pathname={pathname}
                onNavigate={handleNavigate}
              />
            ))}
          </List>
        </Box>

        {/* Footer Info */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem', fontWeight: 500 }}>
              Version 1.0.0
            </Typography>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'success.main',
                boxShadow: '0 0 0 2px rgba(5, 150, 105, 0.2)',
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6875rem' }}>
            © {new Date().getFullYear()} {branding.name}
          </Typography>
        </Box>
      </Box>
    ),
    [pathname, handleNavigate, branding]
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Header Actions */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Notifications */}
            <NotificationMenu />


            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* User Info */}
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: '6px',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
                  {nameBuilder(user)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {getRole(user).label}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {userInitials}
              </Avatar>
            </Box>

            {/* User Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}

              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              {/* User Info in Menu */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                  {nameBuilder(user)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {user?.email}
                </Typography>
                <div>
                  <Chip
                    label={getRole(user).label}
                    size="small"
                    sx={{
                      mt: 1,
                      height: 20,
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                    }}
                  />
                </div>
              </Box>

              <MenuItem component={Link} href="/profile" onClick={handleMenuClose} sx={{ py: 1, fontSize: '0.875rem' }}>
                <ListItemIcon>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: '0.875rem', color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}

          sx={{

            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              borderRadius: '0'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100vw',
          overflowX: 'hidden',
          mt: { xs: 7, sm: 8 },
          bgcolor: 'background.default',
          minHeight: '100vh',
          scrollbarGutter: 'stable',

        }}
      >
        {children}
      </Box>
    </Box>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;
