export const nameBuilder = (userObj: any) => {
    if (typeof userObj !== 'object' || !userObj) return '';

    if (userObj && userObj.firstName && userObj.lastName) {
        return `${userObj.firstName} ${userObj.lastName}`;
    }
    if (userObj?.email) return userObj.email;
    return '';
}

export const getRole = (userObj: any) => {
    if (typeof userObj !== 'object' || !userObj) return { value: '', label: '' };
    if (userObj.role) return { value: userObj.role, label: userObj.role.replace(/_/g, ' ') };
    return { value: '', label: '' };
}

export const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    let initials = '';
    for (let i = 0; i < names.length; i++) {
        initials += names[i].charAt(0).toUpperCase();
    }
    return initials;
}   