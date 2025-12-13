import { Box, Typography, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { Controller, useWatch } from 'react-hook-form';
import CountryAutocomplete from '../../molecules/CountryAutocomplete';

interface GeoLimitsFieldProps {
    control: any;
    watch?: any; // kept optional to avoid breaking parent immediately, but effectively unused
}

export default function GeoLimitsField({ control }: GeoLimitsFieldProps) {
    const geoLimitEnabled = useWatch({
        control,
        name: 'geoLimit.enabled',
        defaultValue: false
    });

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Geographic Restrictions</Typography>
                <Controller
                    name="geoLimit.enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={<Checkbox {...field} checked={!!field.value} />}
                            label="Enable geographic restrictions"
                        />
                    )}
                />
            </Grid>

            {geoLimitEnabled && (
                <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select countries where this product is available. Leave empty to allow all (if enabled, usually means restricted to selected).
                    </Typography>
                    <Controller
                        name="geoLimit.countries"
                        control={control}
                        render={({ field }) => (
                            <CountryAutocomplete
                                value={field.value || []}
                                onChange={(newValue) => field.onChange(newValue)}
                                multiple={true}
                                label="Allowed Countries"
                                placeholder="Select countries"
                            />
                        )}
                    />
                </Grid>
            )}
        </>
    );
}
