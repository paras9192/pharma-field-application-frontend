import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyReportsApi } from '@/api/dailyReports';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import dayjs from 'dayjs';

const schema = z.object({
  date: z.string().min(1, 'Date required'),
  productsDiscussed: z.string().optional(),
  highlights: z.string().optional(),
  challenges: z.string().optional(),
  competitorActivity: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DailyReportNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: dayjs().format('YYYY-MM-DD') },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => dailyReportsApi.create({
      date: data.date,
      productsDiscussed: data.productsDiscussed || undefined,
      highlights: data.highlights || undefined,
      challenges: data.challenges || undefined,
      competitorActivity: data.competitorActivity || undefined,
      remarks: data.remarks || undefined,
      status: 'DRAFT',
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['daily-reports'] });
      toast.success('Report created!');
      navigate(`/daily-reports/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create report');
    },
  });

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Create Daily Report</h2>
      <form onSubmit={handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
        <Card>
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
        </Card>
        <Card>
          <div className="space-y-4">
            <Textarea label="Products Discussed" placeholder="Products discussed during visits..." {...register('productsDiscussed')} />
            <Textarea label="Highlights" placeholder="Key highlights of the day..." {...register('highlights')} />
            <Textarea label="Challenges" placeholder="Challenges faced..." {...register('challenges')} />
            <Textarea label="Competitor Activity" placeholder="Competitor observations..." {...register('competitorActivity')} />
            <Textarea label="Remarks" placeholder="Additional remarks..." {...register('remarks')} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" fullWidth loading={isSubmitting || createMutation.isPending}>Create Report</Button>
        </div>
      </form>
    </div>
  );
}
