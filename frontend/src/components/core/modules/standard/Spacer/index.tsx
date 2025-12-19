// Spacer Module - Vertical whitespace

interface SpacerConfig {
    height: number;
}

interface SpacerProps {
    config: SpacerConfig;
    styling?: any;
}

export default function Spacer({ config, styling }: SpacerProps) {
    const { height = 40 } = config;

    return (
        <div style={{ height: `${height}px`, ...styling }} aria-hidden="true" />
    );
}
