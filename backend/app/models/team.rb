class Team < ApplicationRecord
  belongs_to :owner, class_name: 'User', foreign_key: 'owner_id', optional: true
  has_many :members
  has_many :users, through: :members

  validates :name, presence: true
end