import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PropertyStatusBadge, DealStageBadge, VisitStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils';
import { Building2, BedDouble, Maximize2, Car, Phone, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const property = await prisma.property.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      site_visits: { include: { buyer: true }, orderBy: { scheduled_at: 'desc' } },
      deals: { include: { buyer: true }, orderBy: { created_at: 'desc' } },
    },
  });

  if (!property) notFound();

  return (
    <div>
      <Header title={property.society_name} subtitle={property.locality} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {/* Photo */}
          <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden relative">
            {property.photos.length > 0 ? (
              <Image src={property.photos[0]} alt={property.society_name} fill className="object-cover" sizes="400px" />
            ) : (
              <Building2 className="h-16 w-16 text-slate-400" />
            )}
          </div>

          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Details</h2>
                <PropertyStatusBadge status={property.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-primary-600 text-base">{formatCurrency(property.price)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span>{property.property_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">BHK</span><span>{property.bhk}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Area</span><span>{property.area_sqft} sqft</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Floor</span><span>{property.floor} of {property.total_floors}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Furnishing</span><span>{property.furnishing}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Parking</span><span>{property.parking ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-right text-xs">{property.address}</span></div>
            </CardContent>
          </Card>

          {/* Owner */}
          <Card>
            <CardHeader><h2 className="font-semibold">Owner</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{property.owner_name}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{property.owner_phone}</div>
            </CardContent>
          </Card>

          {property.amenities.length > 0 && (
            <Card>
              <CardHeader><h2 className="font-semibold">Amenities</h2></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a) => (
                    <span key={a} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{a}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="font-semibold">Deals ({property.deals.length})</h2></CardHeader>
            <CardContent className="p-0">
              {property.deals.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No deals yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {property.deals.map((d) => (
                    <div key={d.id} className="px-6 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{d.buyer.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(d.created_at)}</p>
                      </div>
                      <DealStageBadge stage={d.stage} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Site Visits ({property.site_visits.length})</h2></CardHeader>
            <CardContent className="p-0">
              {property.site_visits.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No visits yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {property.site_visits.map((v) => (
                    <div key={v.id} className="px-6 py-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-sm">{v.buyer.name}</p>
                        <VisitStatusBadge status={v.status} />
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(v.scheduled_at)}</p>
                      {v.buyer_feedback && <p className="text-xs text-gray-600 mt-1 italic">"{v.buyer_feedback}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
