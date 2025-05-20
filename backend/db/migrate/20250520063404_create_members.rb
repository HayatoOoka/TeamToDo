class CreateMembers < ActiveRecord::Migration[7.2]
  def change
    create_table :members do |t|
      t.integer :role, null: false, default: 0 

      t.references :user, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true


      t.timestamps
    end
    add_index :members, [:team_id, :user_id], unique: true
  end
end
