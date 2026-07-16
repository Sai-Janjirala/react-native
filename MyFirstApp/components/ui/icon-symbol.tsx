// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = 
  | 'house.fill'
  | 'paperplane.fill'
  | 'chevron.left.forwardslash.chevron.right'
  | 'chevron.right'
  | 'photo.stack'
  | 'folder'
  | 'heart'
  | 'heart.fill'
  | 'plus'
  | 'trash'
  | 'share'
  | 'info.circle'
  | 'chevron.left'
  | 'camera'
  | 'grid.2x2'
  | 'grid.3x3'
  | 'magnifyingglass'
  | 'game'
  | 'trophy'
  | 'play'
  | 'refresh';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'photo.stack': 'photo-library',
  'folder': 'folder',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'plus': 'add',
  'trash': 'delete',
  'share': 'share',
  'info.circle': 'info',
  'chevron.left': 'chevron-left',
  'camera': 'photo-camera',
  'grid.2x2': 'grid-view',
  'grid.3x3': 'grid-on',
  'magnifyingglass': 'search',
  'game': 'sports-esports',
  'trophy': 'emoji-events',
  'play': 'play-arrow',
  'refresh': 'refresh',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
