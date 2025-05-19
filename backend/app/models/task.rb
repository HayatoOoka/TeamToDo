class Task < ApplicationRecord
  belongs_to :team, foreign_key: 'team_id'
  belongs_to :assignee, class_name: 'User', foreign_key: 'assignee_id'

  validates :title, presence: true
  validates :body, presence: true
  validates :status, presence: true, numericality: { only_integer: true }
end
