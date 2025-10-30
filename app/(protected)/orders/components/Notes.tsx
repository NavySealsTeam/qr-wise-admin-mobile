import { format } from 'date-fns';
import { collection } from 'firebase/firestore';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { useNotesQuery } from '~/hooks/useNotesQuery';
import { db } from '~/lib/firebase';

export default function Notes({ dateToday, refreshing }: { dateToday: Date; refreshing: boolean }) {
  const { addWithMeta } = useFirestoreWrite();
  const { data: notes, refetch } = useNotesQuery(
    {
      date: dateToday,
    },
    'order-notes',
  );

  const [addNote, setAddNote] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (refreshing) {
      refetch?.();
    }
  }, [refreshing]);

  async function handleSaveNote() {
    setLoading(true);
    await addWithMeta(collection(db, 'notes'), {
      text: note,
    });
    setNote('');
    setAddNote(false);
    setLoading(false);
    refetch?.();
  }

  return (
    <View className="gap-2 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
      <Text className="font-OnestMedium text-sm text-default-secondary">Notes</Text>
      {(notes || []).map((note) => (
        <View key={note.id} className="flex-row justify-between gap-2 border-t border-[#22262F] py-2">
          <Text className="flex-1 font-OnestRegular text-base text-default-primary">{note.text}</Text>
          <Text className="font-OnestMedium text-xs text-default-secondary">
            {format(note.createdAt.toDate(), 'hh:mm a')}
          </Text>
        </View>
      ))}
      {addNote ? (
        <View className="gap-2 border-t border-[#22262F] py-2">
          <Textarea
            placeholder="What happened today?"
            className="placeholder:text-[#85888E]"
            value={note}
            onChangeText={setNote}
          />
          <Button
            onPress={handleSaveNote}
            disabled={loading}
            className="flex-row items-center gap-1.5 border border-[#373A41] bg-[#0C0E12]">
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text className="font-OnestSemiBold text-default-secondary">Save note</Text>
            )}
          </Button>
          <TouchableOpacity onPress={() => setAddNote(false)} className="h-10 items-center justify-center">
            <Text className="font-OnestSemiBold text-default-secondary">Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Button
          onPress={() => setAddNote(true)}
          className="flex-row items-center gap-1.5 border border-[#373A41] bg-[#0C0E12]">
          <PlusIcon color="#61656C" size="20" />
          <Text className="font-OnestSemiBold text-default-secondary">Add Note</Text>
        </Button>
      )}
    </View>
  );
}
