import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { doc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import uuid from 'react-native-uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { useAuth } from '~/context/AuthUserContext';
import { useSnackbar } from '~/context/SnackbarContext';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { db } from '~/lib/firebase';
import { cn } from '~/lib/utils';
import { Discount } from '~/types';

export default function AddEditDiscountScreen() {
  const { updateWithMeta } = useFirestoreWrite();
  const { width } = useWindowDimensions();
  const { store, getStore } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { discountId } = useLocalSearchParams<{ discountId: string }>();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discount, setDiscount] = useState<Discount>();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      if (store?.discounts) {
        const discount = store.discounts.find((i) => i.id === discountId) ?? {
          id: uuid.v4(),
          type: '',
          rate: '',
          isSpecial: false,
          requirements: [],
        };
        setDiscount(discount);
        setDiscounts(store.discounts);
      }
    }, [store]),
  );

  const onPressSave = async () => {
    setLoading(true);

    const ref = doc(db, 'stores', store?.id!);
    const updatedDiscounts = [...discounts];

    if (discountId) {
      const discountIndex = updatedDiscounts.findIndex((i) => i.id === discountId);
      updatedDiscounts[discountIndex] = discount!;
    } else {
      updatedDiscounts.push(discount!);
    }

    await updateWithMeta(ref, {
      discounts: updatedDiscounts,
    });

    getStore(store?.id);
    showSnackbar({
      message: discountId ? 'Discount updated successfully!' : 'Discount added successfully!',
      type: 'success',
    });
    setLoading(false);
    router.back();
  };

  const onPressDelete = async () => {
    setDeleteLoading(true);

    const ref = doc(db, 'stores', store?.id!);
    const updatedDiscounts = [...discounts].filter((i) => i.id !== discountId);

    await updateWithMeta(ref, {
      discounts: updatedDiscounts,
    });

    getStore(store?.id);
    showSnackbar({
      message: 'Discount deleted successfully!',
      type: 'success',
    });
    setDeleteLoading(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            enableOnAndroid
            extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
            keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center justify-between px-4 py-1">
              <TouchableOpacity onPress={() => router.back()} className="size-10 items-center justify-center">
                <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <Path
                    d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
                    fill="#22262F"
                  />
                  <Path
                    d="M21.8332 15.9998H10.1665M10.1665 15.9998L15.9998 21.8332M10.1665 15.9998L15.9998 10.1665"
                    stroke="#CECFD2"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Text />
              <View className="size-10" />
            </View>
            <View className="mt-5 gap-4 px-4">
              <Text className="font-OnestSemiBold text-2xl text-default-tertiary">
                {discountId ? 'Update Discount' : 'Add Another Discount'}
              </Text>
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-OnestMedium text-default-secondary">Less VAT</Text>
                  <Switch
                    className={cn(discount?.isSpecial && 'bg-[#78B300]')}
                    checked={!!discount?.isSpecial}
                    onCheckedChange={(checked) => discount && setDiscount({ ...discount, isSpecial: checked })}
                  />
                </View>
              </View>
              <View className="gap-1.5">
                <Text className="font-OnestMedium text-default-secondary">Discount Type</Text>
                <Input
                  value={discount?.type}
                  onChangeText={(text) => discount && setDiscount({ ...discount, type: text })}
                />
              </View>
              <View className="gap-1.5">
                <Text className="font-OnestMedium text-default-secondary">Discount Rate (%)</Text>
                <Input
                  value={discount?.rate}
                  onChangeText={(text) => discount && setDiscount({ ...discount, rate: text })}
                  inputMode="numeric"
                />
              </View>
              <View className="mt-10">
                <View className="flex-row items-center justify-between">
                  <Text className="font-OnestSemiBold text-2xl text-default-tertiary">Requirements</Text>
                  <TouchableOpacity
                    onPress={() => {
                      discount &&
                        setDiscount({
                          ...discount,
                          requirements: [...(discount.requirements || []), { food: 0, beverage: 0 }],
                        });
                    }}
                    className="flex gap-1 hover:bg-transparent active:bg-transparent">
                    <Text className="font-OnestSemiBold text-[#1563B9]">+ Add requirement</Text>
                  </TouchableOpacity>
                </View>
                {(discount?.requirements || []).map((requirement, index) => (
                  <View key={index} className="mt-5 flex-row gap-2">
                    <View className="grid gap-2">
                      <Text className="font-OnestMedium text-[#F7F7F7]">Food</Text>
                      <Select
                        value={{
                          label: requirement.food.toString(),
                          value: requirement.food.toString(),
                        }}
                        onValueChange={(value) => {
                          discount &&
                            setDiscount({
                              ...discount,
                              requirements: (discount.requirements || []).map((r, idx) =>
                                idx === index ? { ...r, food: Number(value?.value) } : r,
                              ),
                            });
                        }}>
                        <SelectTrigger style={{ width: width / 2.5 }}>
                          <SelectValue placeholder="0" className="font-OnestMedium text-default-primary" />
                        </SelectTrigger>
                        <SelectContent style={{ width: width / 2.5 }} className="mt-0.5 bg-[#13161B] shadow-none">
                          {Array.from({ length: 6 }).map((_, i) => {
                            const count = i;
                            return <SelectItem key={i} label={count.toString()} value={count.toString()} />;
                          })}
                        </SelectContent>
                      </Select>
                    </View>
                    <View className="grid gap-2">
                      <Text className="font-OnestMedium text-[#F7F7F7]">Beverage</Text>
                      <Select
                        value={{
                          label: requirement.beverage.toString(),
                          value: requirement.beverage.toString(),
                        }}
                        onValueChange={(value) => {
                          discount &&
                            setDiscount({
                              ...discount,
                              requirements: (discount.requirements || []).map((r, idx) =>
                                idx === index ? { ...r, beverage: Number(value?.value) } : r,
                              ),
                            });
                        }}>
                        <SelectTrigger style={{ width: width / 2.5 }}>
                          <SelectValue placeholder="0" className="font-OnestMedium text-default-primary" />
                        </SelectTrigger>
                        <SelectContent style={{ width: width / 2.5 }} className="mt-0.5 bg-[#13161B] shadow-none">
                          {Array.from({ length: 6 }).map((_, i) => {
                            const count = i;
                            return <SelectItem key={i} label={count.toString()} value={count.toString()} />;
                          })}
                        </SelectContent>
                      </Select>
                    </View>
                    <View className="grid gap-2">
                      <Text />
                      <TouchableOpacity
                        className="mt-0.5"
                        onPress={() => {
                          discount &&
                            setDiscount({
                              ...discount,
                              requirements: discount.requirements?.filter((req, idx) => idx !== index),
                            });
                        }}>
                        <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          <Path
                            d="M18 6C11.3715 6 6 11.373 6 18C6 24.627 11.3715 30 18 30C24.6285 30 30 24.627 30 18C30 11.373 24.6285 6 18 6ZM23.5605 21.4395C23.8418 21.7208 23.9998 22.1022 23.9998 22.5C23.9998 22.8978 23.8418 23.2792 23.5605 23.5605C23.2792 23.8418 22.8978 23.9998 22.5 23.9998C22.1022 23.9998 21.7208 23.8418 21.4395 23.5605L18 20.121L14.5605 23.5605C14.4215 23.7003 14.2563 23.8112 14.0743 23.8869C13.8923 23.9626 13.6971 24.0016 13.5 24.0016C13.3029 24.0016 13.1077 23.9626 12.9257 23.8869C12.7437 23.8112 12.5785 23.7003 12.4395 23.5605C12.1583 23.2792 12.0003 22.8977 12.0003 22.5C12.0003 22.1023 12.1583 21.7208 12.4395 21.4395L15.879 18L12.4395 14.5605C12.1582 14.2792 12.0002 13.8978 12.0002 13.5C12.0002 13.1022 12.1582 12.7208 12.4395 12.4395C12.7208 12.1582 13.1022 12.0002 13.5 12.0002C13.8978 12.0002 14.2792 12.1582 14.5605 12.4395L18 15.879L21.4395 12.4395C21.7208 12.1582 22.1022 12.0002 22.5 12.0002C22.8978 12.0002 23.2792 12.1582 23.5605 12.4395C23.8418 12.7208 23.9998 13.1022 23.9998 13.5C23.9998 13.8978 23.8418 14.2792 23.5605 14.5605L20.121 18L23.5605 21.4395Z"
                            fill="#E33629"
                          />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
        {discountId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="mx-4 mb-4 h-14 border-[#F04438]" disabled={deleteLoading}>
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-OnestSemiBold text-[#F04438]">Delete</Text>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-OnestRegular">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="font-OnestRegular">
                  This action cannot be undone. This will permanently delete your discount and remove your data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text className="font-OnestRegular text-white">Cancel</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={onPressDelete}>
                  <Text className="font-OnestRegular">Continue</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          onPress={onPressSave}
          className="mx-4 mb-10 h-14 bg-[#78B300]"
          disabled={
            loading || (discount?.type || '').trim().length === 0 || (discount?.rate || '').trim().length === 0
          }>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-OnestSemiBold text-white">Save</Text>
          )}
        </Button>
      </SafeAreaView>
    </View>
  );
}
