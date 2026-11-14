import React from 'react';
import { View } from 'react-native';

const MapView = (props) => <View {...props} />;
MapView.Marker = (props) => <View {...props} />;
export const Marker = (props) => <View {...props} />;
export const Callout = (props) => <View {...props} />;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export default MapView;
