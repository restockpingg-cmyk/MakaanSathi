'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PropertyStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, MUMBAI_LOCALITIES, BHK_OPTIONS } from '@/lib/utils';
import { Plus, Search, Building2, BedDouble, Maximize2, Car, Pencil } from 'lucide-react';
import { PhotoUploader } from '@/components/shared/PhotoUploader';

type Property = {
  id: string; owner_name: string; owner_phone: string; locality: string;
  society_name: string; address: string; bhk: string; floor: number;
  total_floors: number; area_sqft: number; price: number;
  property_type: string; furnishing: string; parking: boolean;
  photos: string[]; status: string; amenities: string[];
};

const AMENITY_OPTIONS = ['Gym', 'Swimming Pool', 'Clubhouse', 'Garden', 'Security', 'Power Backup', 'Parking', 'Tennis Court', 'Kids Play Area'];

const emptyForm = {
  owner_name: '', owner_phone: '', locality: '', society_name: '', address: '',
  bhk: '2BHK', floor: '', total_floors: '', area_sqft: '', price: '',
  property_type: 'SALE', furnishing: 'SEMI', parking: false,
  amenities: [] as string[], status: 'AVAILABLE', photos: [] as string[],
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/properties');
    setProperties(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string | boolean) { setForm((f) => ({ ...f, [key]: val })); }
  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Property, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(p.id);
    setForm({
      owner_name: p.owner_name, owner_phone: p.owner_phone,
      locality: p.locality, society_name: p.society_name, address: p.address,
      bhk: p.bhk, floor: String(p.floor), total_floors: String(p.total_floors),
      area_sqft: String(p.area_sqft), price: String(p.price),
      property_type: p.property_type, furnishing: p.furnishing,
      parking: p.parking, amenities: p.amenities, status: p.status,
      photos: p.photos,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      floor: Number(form.floor), total_floors: Number(form.total_floors),
      area_sqft: Number(form.area_sqft), price: Number(form.price),
      photos: form.photos,
    };

    const res = editingId
      ? await fetch(`/api/properties/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (res.ok) { setShowModal(false); load(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed'); }
    setSaving(false);
  }

  const filtered = properties.filter((p) =>
    p.society_name.toLowerCase().includes(search.toLowerCase()) ||
    p.locality.toLowerCase().includes(search.toLowerCase()) ||
    p.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title="Properties"
        subtitle={`${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'} listed`}
        action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Property</Button>}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by society, locality, or owner…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading properties…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                  {p.photos.length > 0 ? (
                    <Image src={p.photos[0]} alt={p.society_name} fill className="object-cover" sizes="400px" />
                  ) : (
                    <Building2 className="h-12 w-12 text-slate-400" />
                  )}
                  <div className="absolute top-2 right-2"><PropertyStatusBadge status={p.status} /></div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">{p.property_type}</span>
                  </div>
                  {/* Edit button */}
                  <button
                    onClick={(e) => openEdit(p, e)}
                    className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 hover:text-primary-600 p-1.5 rounded-lg shadow transition-colors"
                    title="Edit property"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{p.society_name}</p>
                  <p className="text-sm text-gray-500 mb-2">{p.locality}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bhk}</span>
                    <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area_sqft} sqft</span>
                    <span>Floor {p.floor}/{p.total_floors}</span>
                    {p.parking && <Car className="h-3.5 w-3.5 text-green-600" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-gray-500">{p.furnishing}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              {search ? 'No properties match' : 'No properties yet — add your first one'}
            </div>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Property' : 'Add New Property'} size="xl">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input className={inputCls} required value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone *</label>
              <input className={inputCls} required value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locality *</label>
              <select className={inputCls} required value={form.locality} onChange={(e) => set('locality', e.target.value)}>
                <option value="">Select locality</option>
                {MUMBAI_LOCALITIES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Society Name *</label>
              <input className={inputCls} required value={form.society_name} onChange={(e) => set('society_name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input className={inputCls} required value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BHK *</label>
              <select className={inputCls} value={form.bhk} onChange={(e) => set('bhk', e.target.value)}>
                {BHK_OPTIONS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className={inputCls} value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
                <option value="SALE">Sale</option>
                <option value="RENT">Rent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
              <input type="number" className={inputCls} required value={form.floor} onChange={(e) => set('floor', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors *</label>
              <input type="number" className={inputCls} required value={form.total_floors} onChange={(e) => set('total_floors', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft) *</label>
              <input type="number" className={inputCls} required value={form.area_sqft} onChange={(e) => set('area_sqft', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input type="number" className={inputCls} required value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing *</label>
              <select className={inputCls} value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)}>
                <option value="FURNISHED">Furnished</option>
                <option value="SEMI">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="AVAILABLE">Available</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="parking" checked={form.parking} onChange={(e) => set('parking', e.target.checked)} className="h-4 w-4 accent-primary-500" />
              <label htmlFor="parking" className="text-sm font-medium text-gray-700">Parking Available</label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
              <div className="flex gap-2 flex-wrap">
                {AMENITY_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${form.amenities.includes(a) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <PhotoUploader
                photos={form.photos}
                onChange={(urls) => setForm((f) => ({ ...f, photos: urls }))}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Save Changes' : 'Save Property'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}