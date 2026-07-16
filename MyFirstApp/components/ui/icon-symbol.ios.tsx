import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

const IOS_MAPPING: Record<string, any> = {
  'house.fill': 'house.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'photo.stack': 'photo.on.rectangle',
  'folder': 'folder.fill',
  'heart': 'heart',
  'heart.fill': 'heart.fill',
  'plus': 'plus',
  'trash': 'trash.fill',
  'share': 'square.and.arrow.up',
  'info.circle': 'info.circle',
  'chevron.left': 'chevron.left',
  'camera': 'camera.fill',
  'grid.2x2': 'square.grid.2x2.fill',
  'grid.3x3': 'square.grid.3x3.fill',
  'magnifyingglass': 'magnifyingglass',
  'game': 'gamecontroller.fill',
  'trophy': 'trophy.fill',
  'play': 'play.fill',
  'refresh': 'arrow.clockwise',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const sfSymbolName = IOS_MAPPING[name] || name;

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={sfSymbolName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
