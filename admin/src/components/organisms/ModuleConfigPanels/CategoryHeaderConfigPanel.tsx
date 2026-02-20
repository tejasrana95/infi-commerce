import {
    Box,
    FormControlLabel,
    MenuItem,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

export interface CategoryHeaderConfig {
    showImage: boolean;
    showDescription: boolean;
    showBreadcrumbs: boolean;
    descriptionPosition: 'top' | 'bottom' | 'below-image';
    descriptionStyle: 'expanded' | 'collapsed';
    defaultExpanded: boolean;
    expandLabel: string;
    collapseLabel: string;
}

interface CategoryHeaderConfigPanelProps {
    config: Partial<CategoryHeaderConfig>;
    onChange: (config: CategoryHeaderConfig) => void;
}

export const defaultCategoryHeaderConfig: CategoryHeaderConfig = {
    showImage: true,
    showDescription: true,
    showBreadcrumbs: true,
    descriptionPosition: 'below-image',
    descriptionStyle: 'collapsed',
    defaultExpanded: false,
    expandLabel: 'Read more',
    collapseLabel: 'Show less',
};

export default function CategoryHeaderConfigPanel({
    config,
    onChange,
}: CategoryHeaderConfigPanelProps) {
    const mergedConfig: CategoryHeaderConfig = {
        ...defaultCategoryHeaderConfig,
        ...config,
    };

    const handleChange = <K extends keyof CategoryHeaderConfig>(
        key: K,
        value: CategoryHeaderConfig[K]
    ) => {
        onChange({ ...mergedConfig, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={mergedConfig.showBreadcrumbs}
                        onChange={(e) => handleChange('showBreadcrumbs', e.target.checked)}
                    />
                }
                label="Show Breadcrumbs"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={mergedConfig.showImage}
                        onChange={(e) => handleChange('showImage', e.target.checked)}
                    />
                }
                label="Show Category Image"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={mergedConfig.showDescription}
                        onChange={(e) => handleChange('showDescription', e.target.checked)}
                    />
                }
                label="Show Description"
            />

            {mergedConfig.showDescription && (
                <>
                    <TextField
                        select
                        fullWidth
                        label="Description Position"
                        value={mergedConfig.descriptionPosition}
                        onChange={(e) =>
                            handleChange('descriptionPosition', e.target.value as CategoryHeaderConfig['descriptionPosition'])
                        }
                    >
                        <MenuItem value="top">Top</MenuItem>
                        <MenuItem value="below-image">Below Image</MenuItem>
                        <MenuItem value="bottom">Bottom</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Description Style"
                        value={mergedConfig.descriptionStyle}
                        onChange={(e) =>
                            handleChange('descriptionStyle', e.target.value as CategoryHeaderConfig['descriptionStyle'])
                        }
                    >
                        <MenuItem value="expanded">Always Expanded</MenuItem>
                        <MenuItem value="collapsed">Collapsible</MenuItem>
                    </TextField>

                    {mergedConfig.descriptionStyle === 'collapsed' && (
                        <>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={mergedConfig.defaultExpanded}
                                        onChange={(e) => handleChange('defaultExpanded', e.target.checked)}
                                    />
                                }
                                label="Expanded By Default"
                            />

                            <TextField
                                fullWidth
                                label="Expand Label"
                                value={mergedConfig.expandLabel}
                                onChange={(e) => handleChange('expandLabel', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="Collapse Label"
                                value={mergedConfig.collapseLabel}
                                onChange={(e) => handleChange('collapseLabel', e.target.value)}
                            />
                        </>
                    )}
                </>
            )}

            <Typography variant="caption" color="text.secondary">
                These settings control the storefront category header module rendering.
            </Typography>
        </Box>
    );
}
