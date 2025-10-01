import { ImageIcon, InboxIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import PlaceholderImage from '~/components/PlaceholderImage';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useMenuItemsQuery } from '~/hooks/useMenuItemsQuery';
import {
  MENU_BEVERAGE_CATEGORIES,
  MENU_FOOD_CATEGORIES,
  MENU_GROUP_OPTION_CATEGORIES,
} from '~/lib/constants';
import { cn, formatPrice, formatStringToNumber } from '~/lib/utils';
import { MenuGroupOptionCategory, MenuItem } from '~/types';

export default function Overview() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const { data: menuItems } = useMenuItemsQuery(
    { enabled: false },
    'menu-items',
  );

  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState<{
    category: MenuGroupOptionCategory;
    subCategory: string;
    name: string;
    availability: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
  }>({
    category: 'BEVERAGE',
    subCategory: 'ALL',
    name: '',
    availability: 'ALL',
  });

  useEffect(() => {
    filterRecords();
  }, [menuItems, filter]);

  const filterRecords = () => {
    let filtered = menuItems || [];
    filtered = filtered.filter((record) => record.category === filter.category);

    if (filter.subCategory !== 'ALL') {
      filtered = filtered.filter(
        (record) => record.subCategory === filter.subCategory,
      );
    }

    if (filter.availability !== 'ALL') {
      filtered = filtered.filter(
        (record) => record.enabled === (filter.availability === 'AVAILABLE'),
      );
    }

    filtered = filtered.filter((record) => {
      return record.name.toLowerCase().includes(filter.name.toLowerCase());
    });

    // Sort by enabled (true first) and then by name alphabetically
    filtered.sort((a, b) => {
      if (b.enabled !== a.enabled) {
        return Number(b.enabled) - Number(a.enabled); // Sort enabled first
      }
      return a.name.localeCompare(b.name); // Sort by name alphabetically
    });

    setFilteredMenuItems(filtered);
  };

  return (
    <>
      <View className="flex-row items-center justify-between gap-3">
        <Select
          value={MENU_GROUP_OPTION_CATEGORIES.find(
            (i) => i.value === filter.category,
          )}
          onValueChange={(value) =>
            setFilter({
              ...filter,
              category: value?.value as MenuGroupOptionCategory,
              subCategory: 'ALL',
            })
          }>
          <SelectTrigger
            style={{ width: width / 2.25 }}
            className="bg-[#13161B]">
            <SelectValue
              placeholder=""
              className="font-OnestMedium text-default-primary"
            />
          </SelectTrigger>
          <SelectContent
            style={{ width: width / 2.25 }}
            className="mt-0.5 bg-[#13161B] shadow-none"
            insets={contentInsets}>
            {MENU_GROUP_OPTION_CATEGORIES.map((category) => (
              <SelectItem
                key={category.value}
                label={category.label}
                value={category.value}
              />
            ))}
          </SelectContent>
        </Select>
        {filter.category === 'FOOD' ? (
          <Select
            value={[
              { value: 'ALL', label: 'All' },
              ...MENU_FOOD_CATEGORIES,
            ].find((i) => i.value === filter.subCategory)}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                subCategory: value?.value as MenuGroupOptionCategory,
              }))
            }>
            <SelectTrigger
              style={{ width: width / 2.25 }}
              className="bg-[#13161B]">
              <SelectValue
                placeholder=""
                className="font-OnestMedium text-default-primary"
              />
            </SelectTrigger>
            <SelectContent
              style={{ width: width / 2.25 }}
              className="mt-0.5 bg-[#13161B] shadow-none"
              insets={contentInsets}>
              {[{ value: 'ALL', label: 'All' }, ...MENU_FOOD_CATEGORIES].map(
                (category) => (
                  <SelectItem
                    key={category.value}
                    label={category.label}
                    value={category.value}
                  />
                ),
              )}
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={[
              { value: 'ALL', label: 'All' },
              ...MENU_BEVERAGE_CATEGORIES,
            ].find((i) => i.value === filter.subCategory)}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                subCategory: value?.value as MenuGroupOptionCategory,
              }))
            }>
            <SelectTrigger
              style={{ width: width / 2.25 }}
              className="bg-[#13161B]">
              <SelectValue
                placeholder=""
                className="font-OnestMedium text-default-primary"
              />
            </SelectTrigger>
            <SelectContent
              style={{ width: width / 2.25 }}
              className="mt-0.5 bg-[#13161B] shadow-none"
              insets={contentInsets}>
              {[
                { value: 'ALL', label: 'All' },
                ...MENU_BEVERAGE_CATEGORIES,
              ].map((category) => (
                <SelectItem
                  key={category.value}
                  label={category.label}
                  value={category.value}
                />
              ))}
            </SelectContent>
          </Select>
        )}
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Input
            placeholder="Search"
            className="bg-[#13161B] pl-10"
            value={filter.name}
            onChangeText={(text) => setFilter({ ...filter, name: text })}
          />
          <View className="absolute bottom-0 left-3 top-3">
            <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <G clipPath="url(#clip0_1606_31019)">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.625 2.0625C7.7632 2.0625 6.90984 2.23224 6.11364 2.56204C5.31744 2.89184 4.594 3.37523 3.98461 3.98461C3.37523 4.594 2.89184 5.31744 2.56204 6.11364C2.23224 6.90984 2.0625 7.7632 2.0625 8.625C2.0625 9.4868 2.23224 10.3402 2.56204 11.1364C2.89184 11.9326 3.37523 12.656 3.98461 13.2654C4.594 13.8748 5.31744 14.3582 6.11364 14.688C6.90984 15.0178 7.7632 15.1875 8.625 15.1875C10.3655 15.1875 12.0347 14.4961 13.2654 13.2654C14.4961 12.0347 15.1875 10.3655 15.1875 8.625C15.1875 6.88452 14.4961 5.21532 13.2654 3.98461C12.0347 2.7539 10.3655 2.0625 8.625 2.0625ZM0.9375 8.625C0.9375 4.38 4.38 0.9375 8.625 0.9375C12.87 0.9375 16.3125 4.38 16.3125 8.625C16.3125 10.545 15.6083 12.3015 14.4443 13.6485L16.8975 16.1025C16.9528 16.154 16.9971 16.2161 17.0278 16.2851C17.0586 16.3541 17.0751 16.4286 17.0764 16.5041C17.0778 16.5796 17.0639 16.6547 17.0356 16.7247C17.0073 16.7947 16.9652 16.8584 16.9118 16.9118C16.8584 16.9652 16.7947 17.0073 16.7247 17.0356C16.6547 17.0639 16.5796 17.0778 16.5041 17.0764C16.4286 17.0751 16.3541 17.0586 16.2851 17.0278C16.2161 16.9971 16.154 16.9528 16.1025 16.8975L13.6485 14.4443C12.2541 15.6524 10.47 16.3159 8.625 16.3125C4.38 16.3125 0.9375 12.87 0.9375 8.625Z"
                  fill="#838B91"
                />
              </G>
              <Defs>
                <ClipPath id="clip0_1606_31019">
                  <Rect width="18" height="18" fill="white" />
                </ClipPath>
              </Defs>
            </Svg>
          </View>
        </View>
        <View className="h-12 flex-row items-center gap-2 rounded-lg border border-[#22262F] bg-[#13161B] px-3">
          <Text className="font-OnestSemiBold text-sm text-default-secondary">
            Available
          </Text>
          <View className="w-fit rounded-full border border-[#373A41] bg-[#13161B] px-2 py-1">
            <Text className="font-OnestMedium text-xs text-default-secondary">
              {filteredMenuItems?.length}
            </Text>
          </View>
        </View>
      </View>
      {filteredMenuItems.length === 0 ? (
        <View className="items-center justify-center rounded-lg border border-dashed border-gray-300 bg-[#13161B] p-10">
          <InboxIcon
            className="mb-4 h-10 w-10 text-default-secondary"
            color="#CECFD2"
          />
          <Text className="font-OnestMedium text-lg text-default-secondary">
            No menu items available
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {filteredMenuItems.map((item) => (
            <View
              key={item.id}
              className={cn('mb-5 w-[48%]', !item.enabled && 'opacity-40')}>
              <View>
                {item.images?.[0] ? (
                  <PlaceholderImage
                    imageUrl={item.images?.[0]}
                    className="h-[163px] w-full rounded-[20px]"
                  />
                ) : (
                  <ImageIcon
                    size="163"
                    color="#d4d4d4"
                    className="rounded-[20px]"
                  />
                )}
                {/* <TouchableOpacity className="absolute bottom-1 right-1">
                  <Svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                    <Circle cx="19" cy="19" r="19" fill="#22262F" />
                    <Path
                      d="M10.5729 24.649C10.6153 24.2671 10.6366 24.0761 10.6943 23.8976C10.7456 23.7393 10.818 23.5886 10.9096 23.4496C11.0129 23.293 11.1488 23.1572 11.4205 22.8855L23.618 10.688C24.6382 9.6678 26.2922 9.6678 27.3124 10.688C28.3326 11.7082 28.3326 13.3623 27.3124 14.3824L15.1149 26.5799C14.8432 26.8516 14.7074 26.9875 14.5508 27.0907C14.4118 27.1824 14.2611 27.2548 14.1028 27.3061C13.9243 27.3638 13.7333 27.3851 13.3514 27.4275L10.2256 27.7748L10.5729 24.649Z"
                      stroke="white"
                      strokeWidth="1.58333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity> */}
              </View>
              <View className="mt-4 flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text
                    className="font-OnestRegular text-xs text-default-primary"
                    numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="font-OnestBold text-xs text-default-tertiary">
                    {formatPrice(formatStringToNumber(item.price))}
                  </Text>
                </View>
                {/* <Switch
                  className={cn(item.enabled && 'bg-[#78B300]')}
                  checked={item.enabled}
                  onCheckedChange={(checked) => console.log(checked)}
                /> */}
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
