import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import Slide from "@mui/material/Slide";

export const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});