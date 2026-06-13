import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatCurrency, formatCurrencyInt } from '../../utils/currency';

const categoryColors = {
  trip: { bg: 'bg-blue-50', icon: '✈️', label: 'Trip' },
  roommates: { bg: 'bg-purple-50', icon: '🏠', label: 'Roommates' },
  couple: { bg: 'bg-pink-50', icon: '💑', label: 'Couple' },
  food: { bg: 'bg-orange-50', icon: '🍕', label: 'Food' },
  other: { bg: 'bg-gray-50', icon: '📋', label: 'Other' },
};

export default function GroupCard({ name, memberCount, totalExpenses, balance, category = 'other', onClick }) {
  const cat = categoryColors[category] || categoryColors.other;

  return (
    <Card onClick={onClick} padding="p-4" className="min-w-[200px] flex-shrink-0">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center text-lg`}>
          {cat.icon}
        </div>
        <Badge variant={balance >= 0 ? 'success' : 'danger'} size="sm">
          {balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(balance))}
        </Badge>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{name}</h3>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{memberCount} members</span>
        <span>{formatCurrencyInt(totalExpenses)} total</span>
      </div>
    </Card>
  );
}
