import { router, useFocusEffect } from 'expo-router';
import { doc } from 'firebase/firestore';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { useAuth } from '~/context/AuthUserContext';
import { useSnackbar } from '~/context/SnackbarContext';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { db } from '~/lib/firebase';
import { cn } from '~/lib/utils';
import { Discount } from '~/types';

export default function Tax() {
  const { updateWithMeta } = useFirestoreWrite();
  const { store } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [discounts, setDiscounts] = useState<Discount[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (store?.discounts) {
        setDiscounts(store.discounts);
      }
    }, [store]),
  );

  async function updateDiscountSpecial(discount: Discount, isSpecial: boolean) {
    const ref = doc(db, 'stores', store?.id!);
    const updatedDiscounts = discounts.map((i) => ({
      ...i,
      isSpecial: i.id === discount.id ? isSpecial : i.isSpecial,
    }));

    await updateWithMeta(ref, {
      discounts: updatedDiscounts,
    });

    setDiscounts(updatedDiscounts);
    showSnackbar({ message: 'Changes successfully saved!', type: 'success' });
  }

  return (
    <>
      <View className="gap-2">
        <Text className="font-OnestSemiBold text-default-primary">Value Added Tax</Text>
        <View className="gap-2 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
          <TouchableOpacity
            onPress={() =>
              showSnackbar({
                message: 'Contact support to change VAT',
                type: 'info',
              })
            }
            className="gap-1">
            <Text className="font-OnestMedium text-xs text-default-secondary">Tax %</Text>
            <Text className="font-OnestSemiBold text-base text-default-primary">{store?.vatTaxPercentage}</Text>
            <View className="absolute bottom-0 right-0 top-0">
              <ChevronRightIcon color="#CECFD2" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-OnestSemiBold text-default-primary">Service Charge</Text>
        <View className="gap-2 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/update-info?id=${store?.id}&value=${store?.serviceChargePercentage}&label=Service Charge&label2=Tax %&key=serviceChargePercentage&collection=stores`,
              )
            }
            className="gap-1">
            <Text className="font-OnestMedium text-xs text-default-secondary">Tax %</Text>
            <Text className="font-OnestSemiBold text-base text-default-primary">{store?.serviceChargePercentage}</Text>
            <View className="absolute bottom-0 right-0 top-0">
              <ChevronRightIcon color="#CECFD2" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-OnestSemiBold text-default-primary">To Go Charge</Text>
        <View className="gap-2 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/update-info?id=${store?.id}&value=${store?.togoCharge}&label=To Go Charge&label2=Charge (PHP)&key=togoCharge&collection=stores`,
              )
            }
            className="gap-1">
            <Text className="font-OnestMedium text-xs text-default-secondary">Charge (PHP)</Text>
            <Text className="font-OnestSemiBold text-base text-default-primary">{store?.togoCharge}</Text>
            <View className="absolute bottom-0 right-0 top-0">
              <ChevronRightIcon color="#CECFD2" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-OnestSemiBold text-default-primary">Discounts</Text>
        {discounts.map((discount) => (
          <View key={discount.id} className="gap-2 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="font-OnestMedium text-sm text-default-secondary">Less VAT</Text>
                <Switch
                  className={cn(discount.isSpecial && 'bg-[#78B300]')}
                  checked={discount.isSpecial}
                  onCheckedChange={(checked) => updateDiscountSpecial(discount, checked)}
                />
              </View>
              <TouchableOpacity
                className="w-20 flex-row justify-end"
                onPress={() => router.push(`/add-edit-discount?discountId=${discount.id}`)}>
                <ChevronRightIcon color="#CECFD2" />
              </TouchableOpacity>
            </View>
            <View className="gap-1">
              <Text className="font-OnestMedium text-xs text-default-secondary">Discount Type</Text>
              <Text className="font-OnestSemiBold text-base text-default-primary">{discount.type}</Text>
            </View>
            <Separator className="bg-[#22262F]" />
            <View className="gap-1">
              <Text className="font-OnestMedium text-xs text-default-secondary">Discount Rate (%)</Text>
              <Text className="font-OnestSemiBold text-base text-default-primary">{discount.rate}</Text>
            </View>
          </View>
        ))}
        <Button
          onPress={() => router.push('/add-edit-discount')}
          className="flex-row items-center gap-1 border border-[#373A41] bg-[#0C0E12]">
          <PlusIcon color="#61656C" size="20" />
          <Text className="text-default-secondary">Add Another Discount</Text>
        </Button>
      </View>
    </>
  );
}
