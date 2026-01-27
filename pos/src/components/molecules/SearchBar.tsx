import React from 'react';
import { Search } from 'lucide-react';
import Input from '../atoms/Input';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', autoFocus }: SearchBarProps) {
    return (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-11"
                autoFocus={autoFocus}
                id="search-bar"
            />
        </div>
    );
}
